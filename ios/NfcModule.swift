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
      var ndefTag: NFCNDEFTag?
      
      switch tag {
      case .miFare(let t):
        uidHex = t.identifier.map { String(format: "%02X", $0) }.joined()
        ndefTag = t
      case .iso15693(let t):
        uidHex = t.identifier.map { String(format: "%02X", $0) }.joined()
        ndefTag = t
      case .iso7816(let t):
        uidHex = t.identifier.map { String(format: "%02X", $0) }.joined()
        ndefTag = t
      case .feliCa(let t):
        uidHex = t.currentIDm.map { String(format: "%02X", $0) }.joined()
        ndefTag = t
      @unknown default:
        uidHex = ""
      }

      // Intenta leer mensaje NDEF si el tag lo soporta
      if let ndef = ndefTag {
        ndef.queryNDEFStatus { status, capacity, error in
          if let error = error {
            // Si falla la lectura NDEF, devolver solo UID y tech
            let result: [String: Any] = [
              "uid": uidHex,
              "tech": "\(tag)"
            ]
            self.resolve?(result)
            session.alertMessage = "Tag leído correctamente."
            session.invalidate()
            self.cleanup()
            return
          }
          
          // Si el tag soporta NDEF, intenta leerlo
          if status == .readWrite || status == .readOnly {
            ndef.readNDEF { message, error in
              var result: [String: Any] = [
                "uid": uidHex,
                "tech": "\(tag)"
              ]
              
              // Si hay mensaje NDEF, extraer el primer record
              if let message = message, let firstRecord = message.records.first {
                let typeString = String(data: firstRecord.type, encoding: .utf8) ?? ""
                
                // Para MIME types (application/json), el payload es directo
                // Para Text records, hay que skipear el primer byte (language code)
                var payloadString = ""
                if typeString.contains("json") || typeString == "application/json" {
                  // MIME type - payload directo
                  payloadString = String(data: firstRecord.payload, encoding: .utf8) ?? ""
                } else if firstRecord.typeNameFormat == .nfcWellKnown {
                  // Text record - skipear primer byte
                  if firstRecord.payload.count > 1 {
                    let actualPayload = firstRecord.payload.subdata(in: 1..<firstRecord.payload.count)
                    payloadString = String(data: actualPayload, encoding: .utf8) ?? ""
                  }
                } else {
                  // Otros tipos - intentar leer directo
                  payloadString = String(data: firstRecord.payload, encoding: .utf8) ?? ""
                }
                
                let ndefDict: [String: Any] = [
                  "type": typeString,
                  "payload": payloadString
                ]
                result["ndef"] = ndefDict
              }
              
              self.resolve?(result)
              session.alertMessage = "Tag leído correctamente."
              session.invalidate()
              self.cleanup()
            }
          } else {
            // Tag no soporta NDEF o está vacío
            let result: [String: Any] = [
              "uid": uidHex,
              "tech": "\(tag)"
            ]
            self.resolve?(result)
            session.alertMessage = "Tag leído correctamente."
            session.invalidate()
            self.cleanup()
          }
        }
      } else {
        // El tag no soporta NDEF
        let result: [String: Any] = [
          "uid": uidHex,
          "tech": "\(tag)"
        ]
        self.resolve?(result)
        session.alertMessage = "Tag leído correctamente."
        session.invalidate()
        self.cleanup()
      }
    }
  }

  // MARK: - Helpers

  private func cleanup() {
    session = nil
    resolve = nil
    reject = nil
  }
}
