// TrackingManager.swift

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
  var distanceFilter: CLLocationDistance = 10
  var desiredAccuracy: CLLocationAccuracy = kCLLocationAccuracyNearestTenMeters
  var activityType: CLActivityType = .automotiveNavigation
  var throttleMs: Int = 1500

  private var lastEmitMs: TimeInterval = 0

  // Cola de eventos + sincronización
  private var buffer: [[String: Any]] = []
  private let maxBuffer = 300
  private let queue = DispatchQueue(label: "tracking.queue") // serial para buffer y socket

  // Red
  private let monitor = NWPathMonitor()
  private let monitorQueue = DispatchQueue(label: "tracking.net.monitor")

  // BG task
  private var bgTask: UIBackgroundTaskIdentifier = .invalid

  // Flags de estado
  private var started = false
  private var didRequestAlwaysThisSession = false

  private override init() {
    super.init()
    manager.delegate = self
    manager.pausesLocationUpdatesAutomatically = false
    manager.showsBackgroundLocationIndicator = true

    // Observadores app
    NotificationCenter.default.addObserver(self, selector: #selector(appDidEnterBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
    NotificationCenter.default.addObserver(self, selector: #selector(appWillEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)

    monitor.pathUpdateHandler = { [weak self] path in
      guard let self else { return }
      if path.status == .satisfied {
        self.queue.async { self.flushBuffer_locked() }
      }
    }
    monitor.start(queue: monitorQueue)
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
    monitor.cancel()
  }

  func setNamespace(_ ns: String?) {
    let raw = (ns ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    namespace = raw.isEmpty ? "/tracker" : (raw.hasPrefix("/") ? raw : "/\(raw)")
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
    if let dm = intervalMeters { distanceFilter = dm }
    if let acc = accuracy { desiredAccuracy = acc }
    if let act = activity { activityType = act }

    // Permisos
    let status = manager.authorizationStatus
    if status == .notDetermined {
      manager.requestWhenInUseAuthorization()
      return
    }
    if status == .authorizedWhenInUse, !didRequestAlwaysThisSession {
      didRequestAlwaysThisSession = true
      manager.requestAlwaysAuthorization()
      // volverá por delegate
    }

    configureLocation()
    ensureSocket()

    // Alternar estrategia segun estado
    if #available(iOS 9.0, *) {
      manager.allowsBackgroundLocationUpdates = true
    }
    if UIApplication.shared.applicationState == .active {
      startHighFrequency()
    } else {
      startSignificantChanges()
    }
    started = true
  }

  func stop() {
    started = false
    manager.stopUpdatingLocation()
    manager.stopMonitoringSignificantLocationChanges()
    queue.async {
      self.socket?.disconnect()
      self.socket = nil
      self.socketManager = nil
      self.buffer.removeAll()
    }
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
    // Opcional: solicitar precisión temporal si el usuario desactivó la precisa (iOS 14+)
    if #available(iOS 14.0, *) {
      if manager.accuracyAuthorization == .reducedAccuracy {
        manager.requestTemporaryFullAccuracyAuthorization(withPurposeKey: "LocationPreciseUsage")
      }
    }
  }

  private func startHighFrequency() {
    manager.stopMonitoringSignificantLocationChanges()
    manager.startUpdatingLocation()
  }

  private func startSignificantChanges() {
    manager.stopUpdatingLocation()
    manager.startMonitoringSignificantLocationChanges()
  }

  private func ensureSocket() {
    queue.async {
      // refresca token/url de UserDefaults por si el proceso despertó
      if self.token.isEmpty {
        self.token = UserDefaults.standard.string(forKey: "auth_token") ?? ""
      }
      if self.socketUrl.isEmpty {
        self.socketUrl = UserDefaults.standard.string(forKey: "socket_url") ?? ""
      }
      if self.socket != nil, self.socket?.status == .connected { return }
      guard !self.socketUrl.isEmpty else { return }

      var config: SocketIOClientConfiguration = [
        .log(false),
        .compress,
        .reconnects(true),
        .reconnectWait(2),
        .reconnectWaitMax(20),
        .reconnectAttempts(-1),
        .forceNew(true),
        .forceWebsockets(true),          // 👈 suele ayudar en BG
        .secure(self.socketUrl.hasPrefix("https"))
      ]
      config.insert(.extraHeaders(["Authorization": "Bearer \(self.token)"]))

      self.socketManager = SocketManager(socketURL: URL(string: self.socketUrl)!, config: config)
      self.socket = self.socketManager?.socket(forNamespace: self.namespace)

      self.socket?.on(clientEvent: .connect) { [weak self] _, _ in
        guard let self else { return }
        print("[Socket] connected \(self.namespace)")
        self.queue.async { self.flushBuffer_locked() }
        if let last = UserDefaults.standard.dictionary(forKey: "last_payload") {
          self.socket?.emit(self.roomEvent, last)
        }
      }
      self.socket?.on(clientEvent: .reconnect) { [weak self] _, _ in
        self?.queue.async { self?.flushBuffer_locked() }
      }
      self.socket?.on(clientEvent: .error) { data, _ in print("[Socket] error:", data) }
      self.socket?.on(clientEvent: .disconnect) { data, _ in print("[Socket] disconnect:", data) }

      self.socket?.connect()
    }
  }


  private func emitOrBuffer_locked(_ dict: [String: Any]) {
    // called only inside self.queue
    if let s = socket, s.status == .connected {
      s.emit(roomEvent, dict)
    } else {
      buffer.append(dict)
      if buffer.count > maxBuffer {
        buffer.removeFirst(buffer.count - maxBuffer)
      }
    }
    UserDefaults.standard.set(dict, forKey: "last_payload")
  }

  private func flushBuffer_locked() {
    guard let s = socket, s.status == .connected else { return }
    while !buffer.isEmpty {
      s.emit(roomEvent, buffer.removeFirst())
    }
  }

  private func beginBGTask() {
    if bgTask == .invalid {
      bgTask = UIApplication.shared.beginBackgroundTask(withName: "location_emit") { [weak self] in
        guard let self else { return }
        UIApplication.shared.endBackgroundTask(self.bgTask)
        self.bgTask = .invalid
      }
    }
  }

  private func endBGTask() {
    if bgTask != .invalid {
      UIApplication.shared.endBackgroundTask(bgTask)
      bgTask = .invalid
    }
  }

  // MARK: - App lifecycle

  @objc private func appDidEnterBackground() {
    if started { startSignificantChanges() }
  }

  @objc private func appWillEnterForeground() {
    if started { startHighFrequency() }
  }

  // MARK: - CLLocationManagerDelegate

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    switch manager.authorizationStatus {
    case .authorizedAlways:
      if !started {
        start(intervalMeters: nil, accuracy: nil, activity: nil)
      }
    case .authorizedWhenInUse:
      if !didRequestAlwaysThisSession {
        didRequestAlwaysThisSession = true
        manager.requestAlwaysAuthorization()
      }
    case .denied, .restricted:
      stop()
    case .notDetermined:
      break
    @unknown default: break
    }
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let loc = locations.last else { return }

    // ⚠️ reconecta si hace falta antes de emitir
    beginBGTask()
    ensureSocket()

    // Throttle
    let nowMs = Date().timeIntervalSince1970 * 1000
    if nowMs - lastEmitMs < Double(throttleMs) {
      endBGTask()
      return
    }
    lastEmitMs = nowMs

    let payload: [String: Any] = [
      "latitude": loc.coordinate.latitude,
      "longitude": loc.coordinate.longitude,
      "accuracy": loc.horizontalAccuracy,
      "speed": loc.speed,
      "bearing": loc.course,
      "ts": Int64(nowMs)
    ]

    queue.async {
      self.emitOrBuffer_locked(payload)
      // dale tiempo a conectar + emitir en BG
      DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
        self.endBGTask()
      }
    }
  }


  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    print("[Location] error:", error.localizedDescription)
  }
}
