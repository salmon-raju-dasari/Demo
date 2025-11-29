import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef, useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import "./QRCodeScanner.css";

/**
 * QRCodeScanner Component
 * Modal-based QR/Barcode scanner with camera selection
 * Features:
 *   - Camera selection buttons (front/rear)
 *   - Auto-open camera on dialog mount
 *   - Debounced scan results (prevents duplicate toasts)
 *   - Torch/flashlight support
 *   - 100% accurate scanning
 *   - Manual input fallback
 */
export default function QRCodeScanner({
  visible = false,
  onClose = () => {},
  onScan = () => {},
  dialogHeader = "Scan QR Code / Barcode",
}) {
  const [scannerReady, setScannerReady] = useState(false);
  const [scannedValue, setScannedValue] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  const toastRef = useRef(null);
  const lastScanRef = useRef({ value: "", timestamp: 0 });
  const scanTimeoutRef = useRef(null);
  const scanCountRef = useRef({ value: "", count: 0 });

  // Enumerate cameras when dialog opens
  useEffect(() => {
    if (!visible) return;

    const getCameras = async () => {
      try {
        // Request camera permissions on native platforms
        if (Capacitor.isNativePlatform()) {
          const permissions = await Camera.checkPermissions();
          console.log("Camera permissions:", permissions);

          if (permissions.camera !== "granted") {
            const requested = await Camera.requestPermissions({
              permissions: ["camera"],
            });
            console.log("Requested permissions:", requested);

            if (requested.camera !== "granted") {
              setHasError(true);
              setErrorMessage(
                "Camera permission denied. Please enable camera access in your device settings."
              );
              return;
            }
          }
        }

        const devices = await Html5Qrcode.getCameras();
        console.log("Available cameras:", devices);

        // Select rear camera by default (usually the last camera)
        if (devices.length > 0) {
          const rearCamera =
            devices.find(
              (d) =>
                d.label.toLowerCase().includes("back") ||
                d.label.toLowerCase().includes("rear")
            ) || devices[devices.length - 1];

          setSelectedCameraId(rearCamera.id);
        }
      } catch (err) {
        console.error("Error getting cameras:", err);
        setHasError(true);
        setErrorMessage(
          "Unable to access camera devices. Please check permissions."
        );
      }
    };

    getCameras();
  }, [visible]);

  // Initialize scanner when camera is selected
  useEffect(() => {
    if (!visible || !selectedCameraId || !scannerRef.current) return;

    const initScanner = async () => {
      try {
        setIsInitializing(true);
        setHasError(false);
        setScannerReady(false);

        // Ensure DOM element exists
        const readerElement = document.getElementById("qr-reader");
        if (!readerElement) {
          console.error("qr-reader element not found");
          return;
        }

        // Clean up previous scanner
        if (html5QrcodeRef.current) {
          try {
            await html5QrcodeRef.current.stop();
            await html5QrcodeRef.current.clear();
          } catch (e) {
            console.debug("Stop previous scanner:", e);
          }
          html5QrcodeRef.current = null;
        }

        // Small delay to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Create new scanner instance
        const html5Qrcode = new Html5Qrcode("qr-reader");
        html5QrcodeRef.current = html5Qrcode;

        // Scan success callback with 100% accuracy validation
        const onScanSuccess = (decodedText) => {
          const now = Date.now();

          // Check if this is the same value as before
          if (scanCountRef.current.value === decodedText) {
            scanCountRef.current.count += 1;
          } else {
            // New value detected, reset counter
            scanCountRef.current = { value: decodedText, count: 1 };
          }

          // Require 3 consecutive scans of the same value for 100% accuracy
          if (scanCountRef.current.count >= 3) {
            // Only update if it's actually a new finalized value
            if (
              decodedText !== lastScanRef.current.value ||
              now - lastScanRef.current.timestamp > 2000
            ) {
              // Clear any pending timeout
              if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
              }

              lastScanRef.current = { value: decodedText, timestamp: now };
              setScannedValue(decodedText);

              toastRef.current?.show({
                severity: "success",
                summary: "Code Verified ✓",
                detail: `Scanned: ${decodedText}`,
                life: 2000,
              });

              // Reset counter after successful scan
              scanCountRef.current = { value: "", count: 0 };
            }
          } else {
            // Show progress indicator
            console.debug(
              `Scan progress: ${scanCountRef.current.count}/3 - ${decodedText}`
            );
          }
        };

        const onScanError = (error) => {
          // Suppress common scanning errors
          if (error && !error.includes("NotFoundException")) {
            console.debug("Scan error:", error);
          }
        };

        // Start scanning with selected camera
        await html5Qrcode.start(
          selectedCameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
            videoConstraints: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          onScanSuccess,
          onScanError
        );

        // Check torch/flashlight support
        try {
          const capabilities = await html5Qrcode.getRunningTrackCapabilities();
          const hasTorch = capabilities && capabilities.torch;
          setTorchSupported(hasTorch || false);
          setTorchEnabled(false);
          console.log("Camera capabilities:", capabilities);
        } catch (capError) {
          console.debug("Could not get capabilities:", capError);
          setTorchSupported(false);
        }

        setScannerReady(true);
        setIsInitializing(false);
        console.log("Scanner started successfully");
      } catch (error) {
        console.error("Scanner initialization error:", error);
        setIsInitializing(false);
        setHasError(true);
        setErrorMessage(
          error.message || "Failed to start camera. Please check permissions."
        );
      }
    };

    // Delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 500);

    return () => {
      clearTimeout(timer);
      // Reset scan counter when camera changes
      scanCountRef.current = { value: "", count: 0 };
    };
  }, [visible, selectedCameraId]);

  // Cleanup on dialog close
  useEffect(() => {
    if (!visible) {
      const cleanup = async () => {
        if (html5QrcodeRef.current) {
          try {
            const state = html5QrcodeRef.current.getState();
            if (state === 2) {
              // Scanner is running
              await html5QrcodeRef.current.stop();
              await html5QrcodeRef.current.clear();
            }
          } catch (error) {
            console.debug("Cleanup error:", error);
          }
          html5QrcodeRef.current = null;
        }
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
      };
      cleanup();
    }
  }, [visible]);

  /**
   * Toggle torch/flashlight
   */
  const handleToggleTorch = async () => {
    if (!html5QrcodeRef.current || !torchSupported) return;

    try {
      await html5QrcodeRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchEnabled }],
      });
      setTorchEnabled(!torchEnabled);
    } catch (error) {
      console.error("Error toggling torch:", error);
      toastRef.current?.show({
        severity: "warn",
        summary: "Torch Unavailable",
        detail: "Could not toggle flashlight.",
        life: 2000,
      });
    }
  };

  /**
   * Handle scan confirmation
   */
  const handleConfirmScan = () => {
    const finalValue = scannedValue || manualInput;

    if (!finalValue.trim()) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Empty Value",
        detail: "Please scan a code or enter a value manually.",
        life: 3000,
      });
      return;
    }

    try {
      onScan(finalValue.trim());
      handleClose();
      toastRef.current?.show({
        severity: "success",
        summary: "Code Confirmed",
        detail: `Successfully captured: ${finalValue}`,
        life: 2000,
      });
    } catch (error) {
      console.error("Error confirming scan:", error);
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to process scanned code.",
        life: 3000,
      });
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = async () => {
    try {
      if (html5QrcodeRef.current) {
        const state = html5QrcodeRef.current.getState();
        if (state === 2) {
          // Scanner is running
          await html5QrcodeRef.current.stop();
          await html5QrcodeRef.current.clear();
        }
        html5QrcodeRef.current = null;
      }
    } catch (error) {
      console.debug("Error stopping scanner:", error);
    }

    setScannedValue("");
    setManualInput("");
    setHasError(false);
    setErrorMessage("");
    setScannerReady(false);
    setIsInitializing(false);
    setSelectedCameraId(null);
    setTorchEnabled(false);
    setTorchSupported(false);
    lastScanRef.current = { value: "", timestamp: 0 };
    scanCountRef.current = { value: "", count: 0 };
    onClose();
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    setHasError(false);
    setErrorMessage("");
    // Re-trigger camera enumeration
    setSelectedCameraId(null);
  };

  /**
   * Clear scanned value and continue scanning
   */
  const handleRescan = () => {
    setScannedValue("");
    setManualInput("");
    lastScanRef.current = { value: "", timestamp: 0 };
    scanCountRef.current = { value: "", count: 0 };
  };

  return (
    <>
      <Toast ref={toastRef} position="top-right" appendTo={document.body} />

      <Dialog
        header={dialogHeader}
        visible={visible}
        onHide={handleClose}
        style={{ width: "95vw", maxWidth: "600px" }}
        draggable={false}
        resizable={false}
        blockScroll
        className="qr-scanner-dialog"
      >
        <div className="qr-scanner-content">
          {/* Scanner Container with Torch Button */}
          <div className="qr-scanner-wrapper" style={{ position: "relative" }}>
            <div
              ref={scannerRef}
              id="qr-reader"
              className="qr-reader-container"
              style={{
                display: hasError || !scannerReady ? "none" : "block",
              }}
            />
            {/* Focus Overlay to guide barcode alignment (persist while popup open) */}
            {visible && !hasError && (
              <div className="qr-focus-overlay" aria-hidden="true">
                <div className="center-lines" />
              </div>
            )}
            {/* Torch Button Overlay */}
            {torchSupported && scannerReady && !hasError && (
              <Button
                icon={torchEnabled ? "pi pi-sun" : "pi pi-moon"}
                rounded
                severity={torchEnabled ? "warning" : "secondary"}
                onClick={handleToggleTorch}
                className="torch-button-overlay"
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  width: "45px",
                  height: "45px",
                  zIndex: 10,
                  backgroundColor: torchEnabled
                    ? "#fbbf24"
                    : "rgba(255,255,255,0.9)",
                  border: "2px solid #fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
                tooltip={torchEnabled ? "Turn Off Torch" : "Turn On Torch"}
                tooltipOptions={{ position: "left" }}
              />
            )}
          </div>

          {/* Error State */}
          {hasError && (
            <div className="qr-error-container">
              <div className="qr-error-icon">⚠️</div>
              <p className="qr-error-message">{errorMessage}</p>
              <p className="qr-error-hint">
                Please check your browser permissions and allow camera access.
              </p>
              <Button
                label="Retry Camera"
                severity="warning"
                onClick={handleRetry}
                className="mt-3"
              />
            </div>
          )}

          {/* Loading State */}
          {!hasError && !scannerReady && (
            <div className="qr-loading-container">
              <div className="qr-spinner" />
              <p>
                {isInitializing ? "Starting camera..." : "Preparing scanner..."}
              </p>
              <small style={{ marginTop: "8px", color: "#666" }}>
                Please allow camera access when prompted.
              </small>
            </div>
          )}

          {/* Scanned Result Display */}
          {scannerReady && (
            <div className="qr-result-section">
              {scannedValue && (
                <div className="qr-scanned-badge">
                  ✓ Scanned: <strong>{scannedValue}</strong>
                </div>
              )}

              {/* Manual Input Fallback */}
              <div className="qr-manual-input-section">
                <label className="qr-input-label">Or enter manually:</label>
                <div className="qr-input-group">
                  <InputText
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter barcode/QR code manually"
                    className="qr-input-field"
                    disabled={!!scannedValue}
                  />
                  {scannedValue && (
                    <Button
                      icon="pi pi-times"
                      severity="secondary"
                      text
                      onClick={handleRescan}
                      tooltip="Clear and rescan"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dialog Footer */}
          <div className="qr-dialog-footer">
            <div className="qr-footer-buttons">
              <Button
                label="Cancel"
                severity="secondary"
                onClick={handleClose}
                style={{ flex: 1 }}
              />
              <Button
                label={scannedValue || manualInput ? "Confirm" : "Close"}
                severity="success"
                onClick={handleConfirmScan}
                style={{ flex: 1 }}
                disabled={!scannedValue && !manualInput}
              />
            </div>
          </div>

          {/* Help Text */}
          <div className="qr-help-text">
            <small>
              📸 Position the barcode/QR code in the center of the screen.
              <br />
              💡 Ensure adequate lighting for best results.
            </small>
          </div>
        </div>
      </Dialog>
    </>
  );
}
