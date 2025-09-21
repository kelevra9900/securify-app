import Foundation
import CoreLocation

@objc(TrackingModule)
class TrackingModule: NSObject {

  // RN leerá esto sin necesitar RCTBridgeModule en Swift gracias al wrapper ObjC
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func saveAuth(_ token: String, socketUrl: String, event: String?) {
    TrackingManager.shared.saveAuth(token: token, socketUrl: socketUrl, event: event)
  }

  @objc func start(_ options: NSDictionary?) {
    let ns = options?["namespace"] as? String
    TrackingManager.shared.setNamespace(ns)

    let dist = options?["minDistanceMeters"] as? Double
    let throttle = options?["throttleMs"] as? Int
    let actStr = options?["activityType"] as? String

    var act: CLActivityType = .automotiveNavigation
    if actStr == "fitness" { act = .fitness }
    if let t = throttle { TrackingManager.shared.throttleMs = t }

    TrackingManager.shared.start(
      intervalMeters: dist,
      accuracy: kCLLocationAccuracyNearestTenMeters,
      activity: act
    )
  }

  @objc func update(_ options: NSDictionary) {
    if let ns = options["namespace"] as? String {
      TrackingManager.shared.setNamespace(ns)
    }
    let dist = options["minDistanceMeters"] as? Double
    let throttle = options["throttleMs"] as? Int
    TrackingManager.shared.update(distanceMeters: dist, throttleMs: throttle)
  }

  @objc func stop() {
    TrackingManager.shared.stop()
  }

  // 👇 Implementa lo que declaraste en el bridge
  @objc func requestPermissions() {
    let manager = CLLocationManager()
    let status = manager.authorizationStatus
    if status == .notDetermined {
      manager.requestWhenInUseAuthorization()
      return
    }
    if status == .authorizedWhenInUse {
      manager.requestAlwaysAuthorization()
    }
    // Si ya tienes Always, no hace nada.
  }
}
