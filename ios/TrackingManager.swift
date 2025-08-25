//
//  TrackingManager.swift
//  trablisaRN
//
//  Created by Administrador on 23/08/25.
//

import Foundation
import CoreLocation
import Network
import SocketIO
import UIKit

final class TrackingManager: NSObject, CLLocationManagerDelegate {
  static let shared = TrackingManager()

  private let manager = CLLocationManager()
  private var socketManager: SocketManager?
  private var socket: SocketIOClient?

  private var token: String = ""
  private var socketUrl: String = ""
  private var roomEvent: String = "new_location"
  private var namespace: String = "/tracker"
  
  // Config
  var distanceFilter: CLLocationDistance = 5        // metros
  var desiredAccuracy: CLLocationAccuracy = kCLLocationAccuracyBest
  var activityType: CLActivityType = .fitness       // o .automotiveNavigation
  var throttleMs: Int = 1500

  private var lastEmit: TimeInterval = 0
  private var buffer: [ [String: Any] ] = []
  private let maxBuffer = 300

  // Red para flush de cola
  private let monitor = NWPathMonitor()
  private let monitorQueue = DispatchQueue(label: "net.monitor")

  // BG task para ganar tiempo al emitir
  private var bgTask: UIBackgroundTaskIdentifier = .invalid

  private override init() {
    super.init()
    manager.delegate = self
    manager.pausesLocationUpdatesAutomatically = false
    manager.showsBackgroundLocationIndicator = true

    monitor.pathUpdateHandler = { [weak self] path in
      if path.status == .satisfied { self?.flushBuffer() }
    }
    monitor.start(queue: monitorQueue)
  }
  
  func setNamespace(_ ns: String?) {
    guard let raw = ns?.trimmingCharacters(in: .whitespacesAndNewlines), !raw.isEmpty else {
      namespace = "/tracker"; return
    }
    namespace = raw.hasPrefix("/") ? raw : "/\(raw)"
  }

  // MARK: - Public API

  func saveAuth(token: String, socketUrl: String, event: String?) {
    self.token = token
    self.socketUrl = socketUrl
    if let e = event { self.roomEvent = e }
    UserDefaults.standard.set(token, forKey: "auth_token")
    UserDefaults.standard.set(socketUrl, forKey: "socket_url")
    if let e = event { UserDefaults.standard.set(e, forKey: "socket_event") }
  }

  func start(intervalMeters: Double?, accuracy: CLLocationAccuracy?, activity: CLActivityType?) {
    // permisos: primero WhenInUse, luego Always
    let status = manager.authorizationStatus
    if status == .notDetermined {
      manager.requestWhenInUseAuthorization()
      return
    }
    if status == .authorizedWhenInUse {
      manager.requestAlwaysAuthorization()
      // volverá a llamar a didChangeAuthorization
    }

    if let dm = intervalMeters { distanceFilter = dm }
    if let acc = accuracy { desiredAccuracy = acc }
    if let act = activity { activityType = act }

    configureLocation()
    ensureSocket()

    // Comienza
    if #available(iOS 9.0, *) {
      manager.allowsBackgroundLocationUpdates = true
    }
    //manager.startUpdatingLocation() // para alta frecuencia
    // Alternativa low-power:
    manager.startMonitoringSignificantLocationChanges()
  }

  func stop() {
    manager.stopUpdatingLocation()
    manager.stopMonitoringSignificantLocationChanges()
    socket?.disconnect()
    socket = nil
    socketManager = nil
  }

  func update(distanceMeters: Double?, throttleMs: Int?) {
    if let d = distanceMeters { distanceFilter = d }
    if let t = throttleMs { self.throttleMs = t }
    manager.distanceFilter = distanceFilter
  }

  // MARK: - Private

  private func configureLocation() {
    manager.desiredAccuracy = desiredAccuracy
    manager.distanceFilter = distanceFilter
    manager.activityType = activityType
  }

  private func ensureSocket() {
    if socket != nil { return }
    if token.isEmpty {
      token = UserDefaults.standard.string(forKey: "auth_token") ?? ""
    }
    if socketUrl.isEmpty {
      socketUrl = UserDefaults.standard.string(forKey: "socket_url") ?? ""
    }
    if socketUrl.isEmpty { return }

    var config: SocketIOClientConfiguration = [.log(false), .compress, .reconnects(true)]
    config.insert(.extraHeaders(["Authorization": "Bearer \(token)"]))

    socketManager = SocketManager(socketURL: URL(string: socketUrl)!, config: config)
    // 👇 usa namespace dinámico
    socket = socketManager?.socket(forNamespace: namespace)

    socket?.on(clientEvent: .connect) { [weak self] _, _ in
      print("[Socket] connected \(self?.namespace ?? "")")
      self?.flushBuffer()
    }
    socket?.connect()
  }

  private func emitOrBuffer(_ dict: [String: Any]) {
    if let s = socket, s.status == .connected {
      s.emit(roomEvent, dict)
    } else {
      buffer.append(dict)
      if buffer.count > maxBuffer { buffer.removeFirst(buffer.count - maxBuffer) }
    }
  }

  private func flushBuffer() {
    guard let s = socket, s.status == .connected else { return }
    while !buffer.isEmpty {
      s.emit(roomEvent, buffer.removeFirst())
    }
  }

  private func beginBGTask() {
    if bgTask == .invalid {
      bgTask = UIApplication.shared.beginBackgroundTask(withName: "location_emit") { [weak self] in
        if let t = self?.bgTask { UIApplication.shared.endBackgroundTask(t) }
        self?.bgTask = .invalid
      }
    }
  }

  private func endBGTask() {
    if bgTask != .invalid {
      UIApplication.shared.endBackgroundTask(bgTask)
      bgTask = .invalid
    }
  }

  // MARK: - CLLocationManagerDelegate

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    switch manager.authorizationStatus {
      case .authorizedAlways:
        // si estabas esperando Always, arranca
        start(intervalMeters: nil, accuracy: nil, activity: nil)
      case .authorizedWhenInUse:
        // intenta pedir Always (solo una vez por sesión para evitar loop)
        manager.requestAlwaysAuthorization()
      case .denied, .restricted:
        stop()
      case .notDetermined:
        break
      @unknown default: break
    }
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let loc = locations.last else { return }

    // Throttle
    let now = Date().timeIntervalSince1970 * 1000
    if now - lastEmit < Double(throttleMs) { return }
    lastEmit = now

    // Construye payload
    let payload: [String: Any] = [
      "latitude": loc.coordinate.latitude,
      "longitude": loc.coordinate.longitude,
      "accuracy": loc.horizontalAccuracy,
      "speed": loc.speed,
      "bearing": loc.course,
      "ts": Int64(now)
    ]

    beginBGTask()
    emitOrBuffer(payload)
    // dale un respiro para enviar
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
      self?.endBGTask()
    }
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    // print("Location error:", error)
  }
}
