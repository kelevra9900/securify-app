//
//  GeolocationModule.swift
//  trablisaRN
//
//  Created by Administrador on 25/08/25.
//

import Foundation
import CoreLocation
import React

@objc(GeolocationModule)
class GeolocationModule: NSObject, CLLocationManagerDelegate {

  private let manager = CLLocationManager()
  private var resolve: RCTPromiseResolveBlock?
  private var reject: RCTPromiseRejectBlock?

  private var timer: Timer?
  private var requestedAt: TimeInterval = 0

  // Config runtime
  private var timeoutMs: Int = 10_000
  private var enableHighAccuracy: Bool = true

  override init() {
    super.init()
    manager.delegate = self
    manager.pausesLocationUpdatesAutomatically = true
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func requestPermissions() {
    let status = manager.authorizationStatus
    if status == .notDetermined {
      manager.requestWhenInUseAuthorization()
    }
    // Si ya tienes WhenInUse y quieres Always, hazlo desde otra UI si aplica.
  }

  @objc func getCurrentPosition(_ options: NSDictionary?,
                                resolve: @escaping RCTPromiseResolveBlock,
                                reject: @escaping RCTPromiseRejectBlock) {
    self.resolve = resolve
    self.reject = reject

    self.timeoutMs = (options?["timeoutMs"] as? Int) ?? 10_000
    self.enableHighAccuracy = (options?["enableHighAccuracy"] as? Bool) ?? true

    // Permisos
    let status = manager.authorizationStatus
    guard status == .authorizedWhenInUse || status == .authorizedAlways else {
      // Solicita permiso y retorna error si no estaba otorgado
      if status == .notDetermined {
        manager.requestWhenInUseAuthorization()
      }
      reject("E_PERMISSION", "Location permission not granted", nil)
      return
    }

    // Precisión
    if enableHighAccuracy {
      manager.desiredAccuracy = kCLLocationAccuracyBest
    } else {
      manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    // Limpia estado previo
    invalidateTimer()
    requestedAt = Date().timeIntervalSince1970

    // Timeout
    timer = Timer.scheduledTimer(withTimeInterval: TimeInterval(timeoutMs) / 1000.0, repeats: false, block: { [weak self] _ in
      self?.finishWithError(code: "E_TIMEOUT", message: "Location request timed out")
    })

    // Inicia una sola lectura
    manager.startUpdatingLocation()
  }

  private func finishWithSuccess(_ loc: CLLocation) {
    let result: [String: Any] = [
      "latitude": loc.coordinate.latitude,
      "longitude": loc.coordinate.longitude,
      "accuracy": loc.horizontalAccuracy,
      "altitude": loc.altitude,
      "speed": loc.speed,
      "bearing": loc.course,
      "timestamp": Int64(loc.timestamp.timeIntervalSince1970 * 1000)
    ]
    resolve?(result)
    cleanup()
  }

  private func finishWithError(code: String, message: String) {
    reject?(code, message, nil)
    cleanup()
  }

  private func cleanup() {
    manager.stopUpdatingLocation()
    invalidateTimer()
    resolve = nil
    reject = nil
  }

  private func invalidateTimer() {
    timer?.invalidate()
    timer = nil
  }

  // MARK: CLLocationManagerDelegate

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let last = locations.last else { return }

    // Pequeño filtro: evita puntos muy viejos
    let ageSec = Date().timeIntervalSince(last.timestamp)
    if ageSec > 10 {
      return // espera otro fix más reciente
    }
    finishWithSuccess(last)
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    finishWithError(code: "E_LOCATION", message: error.localizedDescription)
  }
}
