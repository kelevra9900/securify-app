//
//  NfcModule.swift
//  trablisaRN
//
//  Created by Administrador on 25/08/25.
//

import Foundation
import CoreNFC
import React

@objc(NfcModule)
class NfcModule: NSObject, NFCTagReaderSessionDelegate {

  // RN bridge
  @objc static func requiresMainQueueSetup() -> Bool { true }

  // Estado de la sesión
  private var session: NFCTagReaderSession?
  private var resolve: RCTPromiseResolveBlock?
  private var reject: RCTPromiseRejectBlock?

  // MARK: - API

  /// Verifica si el dispositivo soporta lectura NFC
  @objc func isSupported(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve(NFCTagReaderSession.readingAvailable)
  }

  /// Inicia una lectura de tag NFC (UID y NDEF simple)
  /// options: { timeoutMs?: number }
  @objc func scanTag(_ options: NSDictionary?,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard NFCTagReaderSession.readingAvailable else {
      reject("E_UNSUPPORTED", "NFC not supported on this device", nil as NSError?)
      return
    }
    
    self.resolve = resolve
    self.reject = reject

    // Crea la sesión: ISO 14443/15693/18092 cubre la mayoría (MiFare, ISO7816, FeliCa)
    let s = NFCTagReaderSession(pollingOption: [.iso14443, .iso15693, .iso18092], delegate: self)
    s?.alertMessage = "Acerca tu iPhone al tag NFC del checkpoint."
    self.session = s
    s?.begin()

    // Timeout opcional (CoreNFC no tiene timeout automático)
    let timeoutMs = (options?["timeoutMs"] as? Int) ?? 10000
    DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(timeoutMs)) { [weak self] in
      guard let self, let sess = self.session else { return }
      // Si sigue activa luego del timeout, se invalida como timeout
      self.reject?("E_TIMEOUT", "NFC scan timed out", nil as NSError?)
      sess.invalidate()
      self.cleanup()
    }
  }

  // MARK: - NFCTagReaderSessionDelegate

  func tagReaderSessionDidBecomeActive(_ session: NFCTagReaderSession) {
    // No-op
  }

  func tagReaderSession(_ session: NFCTagReaderSession, didInvalidateWithError error: Error) {
    // Si ya resolvimos/rechazamos, solo limpia
    cleanup()
  }

  func tagReaderSession(_ session: NFCTagReaderSession, didDetect tags: [NFCTag]) {
    guard let tag = tags.first else { return }

    session.connect(to: tag) { [weak self] err in
      guard let self else { return }
      if let err = err {
        self.reject?("E_CONNECT", err.localizedDescription, err as NSError)
        session.invalidate()
        self.cleanup()
        return
      }

      // Extrae UID según tecnología
      let uidHex: String
      switch tag {
      case .miFare(let t):
        uidHex = t.identifier.map { String(format: "%02X", $0) }.joined()
      case .iso15693(let t):
        uidHex = t.identifier.map { String(format: "%02X", $0) }.joined()
      case .iso7816(let t):
        uidHex = t.identifier.map { String(format: "%02X", $0) }.joined()
      case .feliCa(let t):
        uidHex = t.currentIDm.map { String(format: "%02X", $0) }.joined()
      @unknown default:
        uidHex = ""
      }

      // Intento de leer primer registro NDEF (si existe) vía polling NDEF (opcional)
      // CoreNFC con Tag Reader no expone NDEF Records de forma directa en todos los casos.
      // Mantendremos return mínimo con uid + tipo; si necesitas NDEF, podemos cambiar a NFCNDEFReaderSession.
      let result: [String: Any] = [
        "uid": uidHex,
        "tech": "\(tag)" // descripción simple (MiFare/ISO15693/etc.)
      ]

      self.resolve?(result)

      session.alertMessage = "Tag leído correctamente."
      session.invalidate()
      self.cleanup()
    }
  }

  // MARK: - Helpers

  private func cleanup() {
    session = nil
    resolve = nil
    reject = nil
  }
}
