export const CV_DOCUMENT_CSS = `
.cv-document{color:#0f172a;font-family:var(--font-document,SmartBody,Arial,sans-serif);font-size:14px;line-height:1.75}
.cv-document .cv-display{font-family:var(--font-display,SmartDisplay,Georgia,serif);font-optical-sizing:auto}
.document-page[dir=rtl] .cv-document .cv-display,html[dir=rtl] .cv-document .cv-display{font-family:var(--font-display-ar,SmartDisplayArabic,SmartBody,serif)}
.cv-document .cv-header{padding-bottom:24px}
.cv-document.professional .cv-header{border-bottom:2px solid #1d4ed8}
.cv-document.editorial .cv-header{border-inline-start:4px solid #1d4ed8;padding-inline-start:24px}
.cv-document .cv-identity{display:flex;align-items:center;gap:18px}
.cv-document .cv-identity-copy{min-width:0}
.cv-document .cv-photo{width:82px;height:82px;flex:0 0 82px;border:2px solid #fff;border-radius:999px;object-fit:cover;box-shadow:0 0 0 1px #cbd5e1}
.cv-document .cv-name{margin:0;font-size:34px;font-weight:650;line-height:1.2}
.cv-document .cv-headline{margin:8px 0 0;color:#1d4ed8;font-size:18px;font-weight:700;line-height:1.45}
.cv-document .cv-specialization{margin:4px 0 0;color:#475569;font-size:13px;font-weight:600;line-height:1.5}
.cv-document .cv-contacts{margin:12px 0 0;color:#475569;font-size:12.5px;line-height:1.6}
.cv-document .cv-section{margin-top:28px}
.cv-document .cv-section-title{margin:0 0 12px;color:#0f172a;font-size:16px;font-weight:700;line-height:1.4;break-after:avoid}
.cv-document .cv-body-copy{margin:0;color:#334155;font-size:14px;line-height:1.75;white-space:pre-wrap}
.cv-document .cv-entry{margin:0 0 24px;break-inside:avoid}
.cv-document .cv-entry-head{display:flex;align-items:baseline;justify-content:space-between;gap:20px}
.cv-document .cv-entry-title{margin:0;font-size:15px;font-weight:700;line-height:1.5}
.cv-document .cv-entry-company{margin:0;color:#1d4ed8;font-size:13px;font-weight:700;line-height:1.6}
.cv-document .cv-entry-school{margin:0;color:#475569;font-size:13px;line-height:1.6}
.cv-document .cv-entry-date{margin:0;flex-shrink:0;color:#64748b;font-size:12px;line-height:1.6;white-space:nowrap}
.cv-document .cv-achievements{margin:10px 0 0;padding-inline-start:20px;color:#334155;font-size:13.5px;line-height:1.72;list-style:disc}
.cv-document .cv-achievements li+li{margin-top:6px}
.cv-document .cv-achievements li[dir=rtl]{list-style-position:inside;text-align:right}
.cv-document .cv-skills{display:flex;flex-wrap:wrap;gap:8px}
.cv-document .cv-skill{border:1px solid #dbeafe;border-radius:999px;background:#eff6ff;padding:4px 12px;color:#1e3a8a;font-size:12px;font-weight:650;line-height:1.5;break-inside:avoid}
`.replace(/\n/g, "");
