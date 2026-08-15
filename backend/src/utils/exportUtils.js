const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { Parser } = require("json2csv");

const REPORTS_DIR = path.join(__dirname, "../../reports");

// Make sure the folder to save generated files actually exists.
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Turns a flat array of rows into a downloadable CSV file.
function generateCSV(fileName, rows) {
  // json2csv needs fields when rows are empty.
  const fields =
    rows && rows.length > 0
      ? Object.keys(rows[0])
      : ["type", "category", "amount"];

  const parser = new Parser({ fields });
  const csv = parser.parse(rows || []);

  const filePath = path.join(REPORTS_DIR, `${fileName}.csv`);
  fs.writeFileSync(filePath, csv);

  return filePath;
}

// Turns a title + summary object into a simple PDF file.
function generatePDF(fileName, title, summaryLines) {
  const filePath = path.join(REPORTS_DIR, `${fileName}.pdf`);
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text("TaxPal", { align: "left" });
  doc.fontSize(14).text(title, { align: "left" });
  doc.moveDown();

  summaryLines.forEach((line) => {
    doc.fontSize(11).text(line);
  });

  doc.end();

  return filePath;
}

module.exports = {
  generateCSV,
  generatePDF,
  REPORTS_DIR,
};