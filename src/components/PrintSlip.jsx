import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import "../styles/print-slip.css";

export default function PrintSlip({ visible, onHide, product }) {
  const barcodeRef = useRef();
  const printRef = useRef();

  // Generate QR code
  const generateQRCode = async () => {
    const qrcodeRef = document.getElementById("qrcode-canvas");
    if (qrcodeRef && product?.barcode) {
      try {
        console.log("Generating QR code for:", product.barcode);
        await QRCode.toCanvas(qrcodeRef, product.barcode, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        console.log("QR code generated successfully");
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    } else {
      console.warn("QR code canvas or product barcode not available");
    }
  };

  // Generate barcode and QR code when component mounts or product changes
  useEffect(() => {
    if (visible && product?.barcode) {
      console.log(
        "Generating codes for product:",
        product.productname,
        "Barcode:",
        product.barcode
      );

      // Generate barcode in preview - wait a bit for DOM to be ready
      const generateBarcode = () => {
        if (barcodeRef.current) {
          console.log(
            "barcodeRef.current exists, type:",
            barcodeRef.current.tagName
          );
          try {
            // Clear previous barcode
            barcodeRef.current.innerHTML = "";
            JsBarcode(barcodeRef.current, product.barcode, {
              format: "CODE128",
              width: 2,
              height: 50,
              displayValue: true,
              margin: 10,
            });
            console.log("Barcode generated successfully in preview");
          } catch (err) {
            console.error("Error generating barcode in preview:", err);
          }
        } else {
          console.warn("barcodeRef.current is null, retrying...");
          // Retry after a short delay
          setTimeout(generateBarcode, 100);
        }
      };

      // Wait for DOM to be ready
      setTimeout(generateBarcode, 50);

      // Generate QR code
      setTimeout(() => {
        generateQRCode();
      }, 100);
    }
  }, [visible, product]);

  const handlePrint = async () => {
    console.log("=== PRINT FUNCTION STARTED ===");
    console.log("Product:", product);
    console.log("Product barcode:", product?.barcode);

    // Generate barcode SVG
    let barcodeSVG = "";
    if (product?.barcode) {
      console.log("Attempting to generate barcode for:", product.barcode);
      try {
        // Create a temporary container for the barcode
        const tempContainer = document.createElement("div");
        tempContainer.style.display = "none";
        document.body.appendChild(tempContainer);

        // Create SVG element for barcode
        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        tempContainer.appendChild(svg);

        console.log("SVG element created, calling JsBarcode...");

        // Generate barcode on the SVG
        JsBarcode(svg, product.barcode, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          margin: 10,
        });

        console.log("JsBarcode called successfully");

        // Get SVG as string
        barcodeSVG = new XMLSerializer().serializeToString(svg);
        console.log("Barcode SVG length:", barcodeSVG.length);
        console.log("Barcode SVG preview:", barcodeSVG.substring(0, 200));

        // Clean up
        document.body.removeChild(tempContainer);
      } catch (err) {
        console.error("Error generating barcode for print:", err);
        console.error("Error stack:", err.stack);
        barcodeSVG = "";
      }
    } else {
      console.warn("No product barcode available!");
    }

    // Create hidden iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const html = `
      <html>
        <head>
          <title>Product Label - ${product?.productname}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: 2.5in 1.5in; margin: 0; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 4px; 
              background: white; 
              width: 2.5in;
              height: auto;
              font-size: 8px;
            }
            .sticker-container { 
              border: 1px solid #000; 
              padding: 3px;
              width: 100%;
              height: auto;
            }
            .product-name { 
              font-size: 9px; 
              font-weight: bold; 
              text-align: center; 
              margin-bottom: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .price-section { 
              text-align: center; 
              font-size: 11px; 
              font-weight: bold; 
              margin: 2px 0;
              color: #000;
            }
            .barcode-section { 
              text-align: center; 
              margin: 2px 0;
            }
            .barcode-section svg { 
              width: 100%; 
              height: auto; 
              max-height: 35px;
            }
            .product-info {
              font-size: 7px;
              text-align: center;
              margin-top: 1px;
            }
            
            @media print { 
              body { padding: 0; }
              .sticker-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="sticker-container">
            <div class="product-name">${product?.productname || "N/A"}</div>
            <div class="price-section">₹${parseFloat(
              product?.price || 0
            ).toFixed(2)}</div>
            
            ${
              barcodeSVG
                ? `
            <div class="barcode-section">
              ${barcodeSVG}
            </div>
            `
                : ""
            }
            
            <div class="product-info">
              ${product?.brand ? `${product.brand} | ` : ""}ID: ${
      product?.productid || "N/A"
    }
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("Print data:", {
      barcodeSVG: barcodeSVG ? "Generated" : "Not generated",
      productBarcode: product?.barcode,
    });

    // Check if running in Electron
    const isElectron = !!(
      window.electron || navigator.userAgent.includes("Electron")
    );

    if (isElectron) {
      // For Electron, open in a new window with print preview
      const printWindow = window.open(
        "",
        "Print Preview",
        "width=400,height=600"
      );

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } else {
      // For web browsers, use iframe
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Wait for content to load, then print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          // Remove iframe after printing
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 100);
        }, 300);
      };
    }
  };

  if (!product) return null;

  return (
    <Dialog
      header="Product Slip Preview"
      visible={visible}
      onHide={onHide}
      modal
      style={{ width: "90vw", maxWidth: "700px" }}
      footer={
        <div className="flex gap-2 justify-end">
          <Button
            label="Close"
            icon="pi pi-times"
            onClick={onHide}
            className="p-button-secondary"
          />
          <Button
            label="Print"
            icon="pi pi-print"
            onClick={handlePrint}
            className="p-button-primary"
          />
        </div>
      }
    >
      <div ref={printRef} className="print-slip-container">
        {/* Header */}
        <div className="slip-header">
          <h2>{product.productname}</h2>
          <p>Product Details Slip</p>
        </div>

        {/* Main Content */}
        <div className="slip-content">
          {/* Product Information */}
          <div className="details-grid">
            <div className="content-section">
              <label>Product ID:</label>
              <span>{product.productid || "N/A"}</span>
            </div>
            <div className="content-section">
              <label>Product Name:</label>
              <span>{product.productname || "N/A"}</span>
            </div>
            <div className="content-section">
              <label>Price:</label>
              <span className="price-highlight">
                ₹{parseFloat(product.price || 0).toFixed(2)}
              </span>
            </div>
            <div className="content-section">
              <label>Stock Quantity:</label>
              <span>{product.quantity || product.openingstock || 0}</span>
            </div>
            {product.brand && (
              <div className="content-section">
                <label>Brand:</label>
                <span>{product.brand}</span>
              </div>
            )}
            {product.category && (
              <div className="content-section">
                <label>Category:</label>
                <span>{product.category}</span>
              </div>
            )}
            {product.unit && (
              <div className="content-section">
                <label>Unit:</label>
                <span>{product.unit}</span>
              </div>
            )}
            {product.discount > 0 && (
              <div className="content-section">
                <label>Discount:</label>
                <span>{product.discount}%</span>
              </div>
            )}
          </div>

          {/* Barcode Section */}
          {product.barcode && (
            <div className="barcode-section">
              <label>Scan Barcode:</label>
              <div
                style={{
                  margin: "10px 0",
                  padding: "10px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <svg
                  ref={barcodeRef}
                  style={{ maxWidth: "100%", height: "auto" }}
                ></svg>
              </div>
              <span
                style={{ fontSize: "12px", color: "#666", fontWeight: "bold" }}
              >
                {product.barcode}
              </span>
            </div>
          )}

          {/* QR Code Section */}
          {product.barcode && (
            <div className="qrcode-section">
              <label>Scan QR Code:</label>
              <div
                style={{
                  margin: "10px 0",
                  display: "flex",
                  justifyContent: "center",
                  padding: "10px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <canvas
                  id="qrcode-canvas"
                  style={{ maxWidth: "100%", height: "auto" }}
                ></canvas>
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="content-section" style={{ marginTop: "15px" }}>
              <label>Description:</label>
              <span>{product.description}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="slip-footer">
          <p>Generated on {new Date().toLocaleString()}</p>
          <p>Please scan the barcode or QR code for quick product lookup</p>
        </div>
      </div>
    </Dialog>
  );
}
