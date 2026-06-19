import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { Plus, ArrowLeft, CheckCircle, Circle, Printer, X, Loader2, Download, Image } from 'lucide-react'
import { db } from '../firebase/config'
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'

function calcInstallment(productPrice, profitPct, downPayment, months) {
  const total = productPrice * (1 + profitPct / 100)
  const remaining = total - downPayment
  const monthly = remaining / months
  const profit = total - productPrice
  return { total, remaining, monthly, profit }
}

// ===== TikTok SVG icon =====
const TikTokIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
  </svg>
)

// ===== Build printable HTML string =====
function buildInvoiceHTML(customer) {
  const { total, monthly, profit } = calcInstallment(
    customer.productPrice, customer.profitPct, customer.downPayment, customer.months
  )
  const paidMonths = (customer.payments || []).filter(Boolean).length
  const paidAmount = customer.downPayment + paidMonths * monthly
  const remainingBalance = total - paidAmount

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>MJ TRADERS - Invoice ${customer.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; color: #111; padding: 40px; font-size: 13px; }
    .invoice-wrap { max-width: 720px; margin: 0 auto; border: 2px solid #CF0A0A; border-radius: 12px; overflow: hidden; }

    .header { background: linear-gradient(135deg, #1a0000, #CF0A0A); color: white; padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 32px; font-weight: 900; letter-spacing: 2px; }
    .logo .j { color: #B8960C; }
    .logo .s { font-size: 14px; font-weight: 400; letter-spacing: 4px; color: rgba(255,255,255,0.7); margin-left: 8px; }
    .header-right { text-align: right; }
    .invoice-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .invoice-id { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
    .header-date { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 6px; }

    .body { padding: 28px 32px; background: white; }

    .info-row { display: flex; gap: 20px; margin-bottom: 20px; }
    .info-box { flex: 1; }
    .info-box h4 { font-size: 11px; font-weight: 700; color: #CF0A0A; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #CF0A0A22; }
    .info-box p { font-size: 13px; color: #333; margin-bottom: 3px; }
    .info-box p span { font-weight: 600; color: #111; }

    .guarantor-box { background: #fff8f0; border: 1px solid #CF0A0A44; border-radius: 8px; padding: 14px 20px; margin-bottom: 20px; }
    .guarantor-box h4 { font-size: 11px; font-weight: 700; color: #CF0A0A; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #CF0A0A22; }
    .guarantor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
    .guarantor-grid p { font-size: 12px; color: #333; }
    .guarantor-grid p span { font-weight: 600; color: #111; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #CF0A0A; color: white; }
    thead th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; letter-spacing: 1px; }
    tbody tr { border-bottom: 1px solid #f0f0f0; }
    tbody tr:nth-child(even) { background: #fafafa; }
    tbody td { padding: 10px 14px; font-size: 13px; color: #333; }
    tbody td.amount { font-weight: 700; color: #CF0A0A; }

    .totals { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; font-size: 13px; }
    .total-row:last-child { border-bottom: none; font-size: 15px; font-weight: 900; color: #CF0A0A; padding-top: 10px; }
    .total-row span:first-child { color: #666; }

    .months-title { font-size: 12px; font-weight: 700; color: #CF0A0A; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
    .months-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 24px; }
    .month-cell { border: 1px solid #ddd; border-radius: 6px; padding: 6px; text-align: center; }
    .month-cell.paid { border-color: #22c55e; background: #f0fdf4; }
    .month-cell.due { border-color: #fca5a5; background: #fff5f5; }
    .month-cell .num { font-size: 10px; color: #999; margin-bottom: 2px; }
    .month-cell .status { font-size: 10px; font-weight: 700; }
    .month-cell.paid .status { color: #22c55e; }
    .month-cell.due .status { color: #CF0A0A; }
    .month-cell .amt { font-size: 9px; color: #666; }

    .footer { background: #111; color: white; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; }
    .footer-brand { font-size: 16px; font-weight: 900; }
    .footer-brand .j { color: #B8960C; }
    .footer-brand .r { color: #CF0A0A; }
    .footer-note { font-size: 11px; color: rgba(255,255,255,0.6); text-align: center; }
    .footer-tiktok { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.85); font-weight: 700; }
    .footer-tiktok svg { vertical-align: middle; }

    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; }
    .status-active { background: #dcfce7; color: #16a34a; }
    .status-complete { background: #dbeafe; color: #1d4ed8; }

    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="invoice-wrap">

    <div class="header">
      <div>
        <div class="logo">M<span class="j">J</span><span class="s">TRADERS</span></div>
        <p style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">Premium Electronics & Appliances</p>
        <p style="font-size:11px;color:rgba(255,255,255,0.7);">Pakistan</p>
      </div>
      <div class="header-right">
        <div class="invoice-title">INSTALLMENT INVOICE</div>
        <div class="invoice-id"># ${customer.id}</div>
        <div class="header-date">Date: ${new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        <div style="margin-top:6px;">
          <span class="status-badge ${paidMonths === customer.months ? 'status-complete' : 'status-active'}">
            ${paidMonths === customer.months ? '✓ COMPLETED' : '● ACTIVE'}
          </span>
        </div>
      </div>
    </div>

    <div class="body">

      <div class="info-row">
        <div class="info-box">
          <h4>Customer Details</h4>
          <p><span>${customer.name}</span></p>
          <p>Phone: <span>${customer.phone}</span></p>
          <p>CNIC: <span>${customer.cnic || '—'}</span></p>
          <p>Start Date: <span>${customer.startDate}</span></p>
        </div>
        <div class="info-box" style="text-align:right;">
          <h4>Plan Summary</h4>
          <p>Duration: <span>${customer.months} Months</span></p>
          <p>Profit Ratio: <span>${customer.profitPct}%</span></p>
          <p>Down Payment: <span>Rs. ${customer.downPayment.toLocaleString()}</span></p>
          <p>Months Paid: <span>${paidMonths} / ${customer.months}</span></p>
        </div>
      </div>

      ${(customer.guarantorName || customer.guarantorPhone || customer.guarantorCnic || customer.guarantorAddress) ? `
      <div class="guarantor-box">
        <h4>Guarantor Information</h4>
        <div class="guarantor-grid">
          <p>Name: <span>${customer.guarantorName || '—'}</span></p>
          <p>WhatsApp: <span>${customer.guarantorPhone || '—'}</span></p>
          <p>CNIC: <span>${customer.guarantorCnic || '—'}</span></p>
          <p>Address: <span>${customer.guarantorAddress || '—'}</span></p>
        </div>
      </div>` : ''}

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Original Price</th>
            <th>Profit (${customer.profitPct}%)</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${customer.product}</td>
            <td>Rs. ${customer.productPrice.toLocaleString()}</td>
            <td>Rs. ${Math.round(profit).toLocaleString()}</td>
            <td class="amount">Rs. ${Math.round(total).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>Product Price</span><span>Rs. ${customer.productPrice.toLocaleString()}</span></div>
        <div class="total-row"><span>Profit (${customer.profitPct}%)</span><span>Rs. ${Math.round(profit).toLocaleString()}</span></div>
        <div class="total-row"><span>Total Amount</span><span>Rs. ${Math.round(total).toLocaleString()}</span></div>
        <div class="total-row"><span>Down Payment</span><span>- Rs. ${customer.downPayment.toLocaleString()}</span></div>
        <div class="total-row"><span>Monthly Installment</span><span>Rs. ${Math.round(monthly).toLocaleString()}</span></div>
        <div class="total-row"><span>Amount Paid So Far</span><span>Rs. ${Math.round(paidAmount).toLocaleString()}</span></div>
        <div class="total-row"><span>⚠ Remaining Balance</span><span>Rs. ${Math.round(remainingBalance).toLocaleString()}</span></div>
      </div>

      <div class="months-title">Monthly Payment Schedule</div>
      <div class="months-grid">
        ${(customer.payments || []).map((paid, idx) => `
          <div class="month-cell ${paid ? 'paid' : 'due'}">
            <div class="num">Month ${idx + 1}</div>
            <div class="status">${paid ? '✓ Paid' : 'Due'}</div>
            <div class="amt">Rs.${Math.round(monthly / 1000)}k</div>
          </div>
        `).join('')}
      </div>

    </div>

    <div class="footer">
      <div class="footer-brand"><span class="r">M</span><span class="j">J</span> TRADERS</div>
      <div class="footer-note">
        <p>Thank you for choosing MJ Traders!</p>
        <p style="margin-top:2px;">Generated: ${new Date().toLocaleString()}</p>
      </div>
      <div class="footer-tiktok">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
        </svg>
        @m_j_traders
      </div>
    </div>

  </div>
</body>
</html>`
}

function InvoiceModal({ customer, onClose }) {
  const { total, monthly, profit } = calcInstallment(
    customer.productPrice, customer.profitPct, customer.downPayment, customer.months
  )
  const paidMonths = (customer.payments || []).filter(Boolean).length
  const paidAmount = customer.downPayment + paidMonths * monthly
  const remainingBalance = total - paidAmount

  // ===== Print (PDF) =====
  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=800,height=900')
    win.document.write(buildInvoiceHTML(customer))
    win.document.close()
    win.onload = () => win.print()
  }

  // ===== Download as PNG image using html2canvas =====
  const handleImageDownload = async () => {
    // Load html2canvas dynamically if not already loaded
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    // Inject invoice styles into main document head (scoped with unique prefix)
    const styleId = 'mj-invoice-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        #mj-invoice-capture { font-family: Arial, sans-serif; background: white; color: #111; font-size: 13px; width: 760px; }
        #mj-invoice-capture .invoice-wrap { width: 760px; border: 2px solid #CF0A0A; border-radius: 12px; overflow: hidden; }
        #mj-invoice-capture .inv-header { background: linear-gradient(135deg, #1a0000, #CF0A0A); color: white; padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; }
        #mj-invoice-capture .inv-logo { font-size: 30px; font-weight: 900; }
        #mj-invoice-capture .inv-logo .j { color: #B8960C; }
        #mj-invoice-capture .inv-logo .s { font-size: 13px; font-weight: 400; letter-spacing: 4px; color: rgba(255,255,255,0.7); margin-left: 8px; }
        #mj-invoice-capture .inv-header-right { text-align: right; }
        #mj-invoice-capture .inv-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
        #mj-invoice-capture .inv-id { background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 20px; font-size: 11px; display: inline-block; }
        #mj-invoice-capture .inv-date { font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 5px; }
        #mj-invoice-capture .inv-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; margin-top: 5px; }
        #mj-invoice-capture .inv-body { padding: 24px 32px; background: white; }
        #mj-invoice-capture .inv-info-row { display: flex; gap: 20px; margin-bottom: 18px; }
        #mj-invoice-capture .inv-info-box { flex: 1; }
        #mj-invoice-capture .inv-info-box h4 { font-size: 10px; font-weight: 700; color: #CF0A0A; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 7px; padding-bottom: 3px; border-bottom: 2px solid rgba(207,10,10,0.15); }
        #mj-invoice-capture .inv-info-box p { font-size: 12px; color: #333; margin-bottom: 3px; }
        #mj-invoice-capture .inv-info-box p span { font-weight: 600; color: #111; }
        #mj-invoice-capture .inv-guarantor { background: #fff8f0; border: 1px solid rgba(207,10,10,0.25); border-radius: 8px; padding: 12px 18px; margin-bottom: 16px; }
        #mj-invoice-capture .inv-guarantor h4 { font-size: 10px; font-weight: 700; color: #CF0A0A; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 1px solid rgba(207,10,10,0.15); }
        #mj-invoice-capture .inv-guarantor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 18px; }
        #mj-invoice-capture .inv-guarantor-grid p { font-size: 11px; color: #333; }
        #mj-invoice-capture .inv-guarantor-grid p span { font-weight: 600; color: #111; }
        #mj-invoice-capture table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        #mj-invoice-capture thead tr { background: #CF0A0A; color: white; }
        #mj-invoice-capture thead th { padding: 9px 13px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
        #mj-invoice-capture tbody tr { border-bottom: 1px solid #f0f0f0; }
        #mj-invoice-capture tbody tr:nth-child(even) { background: #fafafa; }
        #mj-invoice-capture tbody td { padding: 9px 13px; font-size: 12px; color: #333; }
        #mj-invoice-capture tbody td.amount { font-weight: 700; color: #CF0A0A; }
        #mj-invoice-capture .inv-totals { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; }
        #mj-invoice-capture .inv-total-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee; font-size: 12px; }
        #mj-invoice-capture .inv-total-row:last-child { border-bottom: none; font-size: 14px; font-weight: 900; color: #CF0A0A; padding-top: 8px; }
        #mj-invoice-capture .inv-total-row span:first-child { color: #666; }
        #mj-invoice-capture .inv-months-title { font-size: 11px; font-weight: 700; color: #CF0A0A; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
        #mj-invoice-capture .inv-months-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px; margin-bottom: 20px; }
        #mj-invoice-capture .inv-month-cell { border: 1px solid #ddd; border-radius: 6px; padding: 6px 4px; text-align: center; }
        #mj-invoice-capture .inv-month-cell.paid { border-color: #22c55e; background: #f0fdf4; }
        #mj-invoice-capture .inv-month-cell.due { border-color: #fca5a5; background: #fff5f5; }
        #mj-invoice-capture .inv-month-cell .num { font-size: 9px; color: #999; margin-bottom: 2px; }
        #mj-invoice-capture .inv-month-cell .status { font-size: 10px; font-weight: 700; }
        #mj-invoice-capture .inv-month-cell.paid .status { color: #22c55e; }
        #mj-invoice-capture .inv-month-cell.due .status { color: #CF0A0A; }
        #mj-invoice-capture .inv-month-cell .amt { font-size: 9px; color: #666; }
        #mj-invoice-capture .inv-footer { background: #111; color: white; padding: 14px 28px; display: flex; justify-content: space-between; align-items: center; }
        #mj-invoice-capture .inv-footer-brand { font-size: 15px; font-weight: 900; }
        #mj-invoice-capture .inv-footer-brand .r { color: #CF0A0A; }
        #mj-invoice-capture .inv-footer-brand .j { color: #B8960C; }
        #mj-invoice-capture .inv-footer-note { font-size: 10px; color: rgba(255,255,255,0.6); text-align: center; }
        #mj-invoice-capture .inv-footer-tiktok { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(255,255,255,0.85); font-weight: 700; }
      `
      document.head.appendChild(style)
    }

    // Calc values
    const { total: t, monthly: m, profit: p } = calcInstallment(
      customer.productPrice, customer.profitPct, customer.downPayment, customer.months
    )
    const pm = (customer.payments || []).filter(Boolean).length
    const paid = customer.downPayment + pm * m
    const remaining = t - paid
    const monthlyRounded = Math.round(m)

    // Build DOM element directly in page (hidden)
    const wrapper = document.createElement('div')
    wrapper.id = 'mj-invoice-capture'
    wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;'
    wrapper.innerHTML = `
      <div class="invoice-wrap">
        <div class="inv-header">
          <div>
            <div class="inv-logo">M<span class="j">J</span><span class="s">TRADERS</span></div>
            <p style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:3px;">Premium Electronics & Appliances</p>
            <p style="font-size:10px;color:rgba(255,255,255,0.7);">Pakistan</p>
          </div>
          <div class="inv-header-right">
            <div class="inv-title">INSTALLMENT INVOICE</div>
            <div class="inv-id"># ${customer.id?.slice(0, 10) || 'N/A'}</div>
            <div class="inv-date">Date: ${new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            <div class="inv-badge" style="background:${pm === customer.months ? '#dbeafe' : '#dcfce7'};color:${pm === customer.months ? '#1d4ed8' : '#16a34a'};">
              ${pm === customer.months ? '✓ COMPLETED' : '● ACTIVE'}
            </div>
          </div>
        </div>
        <div class="inv-body">
          <div class="inv-info-row">
            <div class="inv-info-box">
              <h4>Customer Details</h4>
              <p><span>${customer.name}</span></p>
              <p>Phone: <span>${customer.phone}</span></p>
              <p>CNIC: <span>${customer.cnic || '—'}</span></p>
              <p>Start Date: <span>${customer.startDate}</span></p>
            </div>
            <div class="inv-info-box" style="text-align:right;">
              <h4>Plan Summary</h4>
              <p>Duration: <span>${customer.months} Months</span></p>
              <p>Profit Ratio: <span>${customer.profitPct}%</span></p>
              <p>Down Payment: <span>Rs. ${customer.downPayment.toLocaleString()}</span></p>
              <p>Months Paid: <span>${pm} / ${customer.months}</span></p>
            </div>
          </div>
          ${(customer.guarantorName || customer.guarantorPhone) ? `
          <div class="inv-guarantor">
            <h4>Guarantor Information</h4>
            <div class="inv-guarantor-grid">
              <p>Name: <span>${customer.guarantorName || '—'}</span></p>
              <p>WhatsApp: <span>${customer.guarantorPhone || '—'}</span></p>
              <p>CNIC: <span>${customer.guarantorCnic || '—'}</span></p>
              <p>Address: <span>${customer.guarantorAddress || '—'}</span></p>
            </div>
          </div>` : ''}
          <table>
            <thead><tr>
              <th>Product</th><th>Original Price</th><th>Profit (${customer.profitPct}%)</th><th>Total Amount</th>
            </tr></thead>
            <tbody><tr>
              <td>${customer.product}</td>
              <td>Rs. ${customer.productPrice.toLocaleString()}</td>
              <td>Rs. ${Math.round(p).toLocaleString()}</td>
              <td class="amount">Rs. ${Math.round(t).toLocaleString()}</td>
            </tr></tbody>
          </table>
          <div class="inv-totals">
            <div class="inv-total-row"><span>Product Price</span><span>Rs. ${customer.productPrice.toLocaleString()}</span></div>
            <div class="inv-total-row"><span>Profit (${customer.profitPct}%)</span><span>Rs. ${Math.round(p).toLocaleString()}</span></div>
            <div class="inv-total-row"><span>Total Amount</span><span>Rs. ${Math.round(t).toLocaleString()}</span></div>
            <div class="inv-total-row"><span>Down Payment</span><span>- Rs. ${customer.downPayment.toLocaleString()}</span></div>
            <div class="inv-total-row"><span>Monthly Installment</span><span>Rs. ${monthlyRounded.toLocaleString()}</span></div>
            <div class="inv-total-row"><span>Amount Paid So Far</span><span>Rs. ${Math.round(paid).toLocaleString()}</span></div>
            <div class="inv-total-row"><span>⚠ Remaining Balance</span><span>Rs. ${Math.round(remaining).toLocaleString()}</span></div>
          </div>
          <div class="inv-months-title">Monthly Payment Schedule</div>
          <div class="inv-months-grid">
            ${(customer.payments || []).map((isPaid, idx) => `
              <div class="inv-month-cell ${isPaid ? 'paid' : 'due'}">
                <div class="num">Month ${idx + 1}</div>
                <div class="status">${isPaid ? '✓ Paid' : 'Due'}</div>
                <div class="amt">Rs.${monthlyRounded.toLocaleString()}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="inv-footer">
          <div class="inv-footer-brand"><span class="r">M</span><span class="j">J</span> TRADERS</div>
          <div class="inv-footer-note">
            <p>Thank you for choosing MJ Traders!</p>
            <p style="margin-top:2px;">Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div class="inv-footer-tiktok">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>
            @m_j_traders
          </div>
        </div>
      </div>
    `
    document.body.appendChild(wrapper)

    await new Promise(r => setTimeout(r, 400))

    try {
      const invoiceEl = wrapper.querySelector('.invoice-wrap')
      const canvas = await window.html2canvas(invoiceEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 760,
        windowWidth: 800,
      })
      const link = document.createElement('a')
      link.download = `MJ-Invoice-${customer.name?.replace(/\s+/g, '_')}-${(customer.id || '').slice(0, 8)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Image download error:', err)
      alert('Image generate karne mein error aayi. PDF try karein.')
    } finally {
      document.body.removeChild(wrapper)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, backgroundColor: '#000000dd', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#0a0a0a', border: '1px solid #CF0A0A44', borderRadius: '20px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1a0000, #CF0A0A)', padding: '24px 28px', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '22px', fontWeight: 900 }}>
              <span style={{ color: 'white' }}>M</span>
              <span style={{ color: '#B8960C' }}>J</span>
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.7)', marginLeft: '6px', letterSpacing: '3px' }}>TRADERS</span>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Installment Invoice</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>#{customer.id}</div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', marginTop: '4px' }}>{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Customer Details */}
          <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: '#CF0A0A', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>CUSTOMER DETAILS</p>
            {[
              ['Name', customer.name],
              ['Phone', customer.phone],
              ['CNIC', customer.cnic || '—'],
              ['Product', customer.product],
              ['Start Date', customer.startDate],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EEEEEE08' }}>
                <span style={{ color: '#EEEEEE55', fontSize: '12px' }}>{l}</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Guarantor Details */}
          {(customer.guarantorName || customer.guarantorPhone) && (
            <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #DC5F0033' }}>
              <p style={{ color: '#DC5F00', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>GUARANTOR INFO</p>
              {[
                ['Name', customer.guarantorName || '—'],
                ['WhatsApp', customer.guarantorPhone || '—'],
                ['CNIC', customer.guarantorCnic || '—'],
                ['Address', customer.guarantorAddress || '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EEEEEE08' }}>
                  <span style={{ color: '#EEEEEE55', fontSize: '12px' }}>{l}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Financial Breakdown */}
          <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: '#B8960C', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>FINANCIAL BREAKDOWN</p>
            {[
              ['Product Price', `Rs. ${customer.productPrice.toLocaleString()}`],
              ['Profit %', `${customer.profitPct}%`],
              ['Profit Amount', `Rs. ${Math.round(profit).toLocaleString()}`],
              ['Total Amount', `Rs. ${Math.round(total).toLocaleString()}`],
              ['Down Payment', `Rs. ${customer.downPayment.toLocaleString()}`],
              ['Monthly Install.', `Rs. ${Math.round(monthly).toLocaleString()}`],
              ['Duration', `${customer.months} Months`],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EEEEEE08' }}>
                <span style={{ color: '#EEEEEE55', fontSize: '12px' }}>{l}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: l === 'Total Amount' ? '#B8960C' : l === 'Monthly Install.' ? '#CF0A0A' : '#EEEEEE' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Payment Status */}
          <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: '#22c55e', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>PAYMENT STATUS</p>
            {[
              ['Months Paid', `${paidMonths} / ${customer.months}`],
              ['Amount Paid', `Rs. ${Math.round(paidAmount).toLocaleString()}`],
              ['Remaining', `Rs. ${Math.round(remainingBalance).toLocaleString()}`],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EEEEEE08' }}>
                <span style={{ color: '#EEEEEE55', fontSize: '12px' }}>{l}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: l === 'Remaining' ? '#f59e0b' : '#22c55e' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Payment Schedule */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#EEEEEE55', letterSpacing: '2px', marginBottom: '10px' }}>PAYMENT SCHEDULE</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {(customer.payments || []).map((paid, idx) => (
                <div key={idx} style={{
                  backgroundColor: paid ? '#22c55e22' : '#CF0A0A11',
                  border: `1px solid ${paid ? '#22c55e44' : '#CF0A0A22'}`,
                  borderRadius: '8px', padding: '8px', textAlign: 'center'
                }}>
                  <p style={{ color: '#EEEEEE44', fontSize: '9px' }}>Month {idx + 1}</p>
                  <p style={{ color: paid ? '#22c55e' : '#CF0A0A55', fontSize: '11px', fontWeight: 700 }}>{paid ? '✓' : '○'}</p>
                  <p style={{ color: paid ? '#22c55e88' : '#EEEEEE22', fontSize: '9px' }}>Rs.{Math.round(monthly / 1000)}k</p>
                </div>
              ))}
            </div>
          </div>

          {/* TikTok Footer note inside modal */}
          <div style={{ backgroundColor: '#111', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <TikTokIcon size={14} color="#EEEEEE88" />
            <span style={{ color: '#EEEEEE55', fontSize: '11px', fontWeight: 700 }}>@m_j_traders</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.03 }} onClick={onClose}
              style={{ flex: 1, minWidth: '80px', backgroundColor: '#1a1a1a', color: '#EEEEEE', border: '1px solid #333', borderRadius: '10px', padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
              Close
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 20px #CF0A0A66' }} onClick={handlePrint}
              style={{ flex: 2, backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Printer size={14} /> Print / PDF
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 20px #B8960C66' }} onClick={handleImageDownload}
              style={{ flex: 2, backgroundColor: '#B8960C', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Download size={14} /> Save as Image
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function AddCustomerModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '', phone: '', cnic: '',
    product: '', productPrice: '',
    profitPct: '', downPayment: '', months: '', startDate: '',
    guarantorName: '', guarantorPhone: '', guarantorCnic: '', guarantorAddress: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.product || !form.productPrice) return
    setSaving(true)
    const months = Number(form.months)
    await onAdd({
      name: form.name,
      phone: form.phone,
      cnic: form.cnic,
      product: form.product,
      productPrice: Number(form.productPrice),
      profitPct: Number(form.profitPct),
      downPayment: Number(form.downPayment),
      months: months,
      startDate: form.startDate,
      guarantorName: form.guarantorName,
      guarantorPhone: form.guarantorPhone,
      guarantorCnic: form.guarantorCnic,
      guarantorAddress: form.guarantorAddress,
      payments: Array(months).fill(false),
      createdAt: new Date().toISOString().split('T')[0]
    })
    setSaving(false)
    onClose()
  }

  const price = Number(form.productPrice) || 0
  const profit = Number(form.profitPct) || 0
  const down = Number(form.downPayment) || 0
  const months = Number(form.months) || 1
  const { total, monthly, profit: profitAmt } = calcInstallment(price, profit, down, months)

  const inputStyle = {
    width: '100%', backgroundColor: '#111111', border: '1px solid #333',
    borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  }
  const labelStyle = { color: '#EEEEEE77', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, backgroundColor: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#0a0a0a', border: '1px solid #CF0A0A44', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontWeight: 900, fontSize: '20px' }}>New <span style={{ color: '#CF0A0A' }}>Installment</span></h2>
          <motion.button whileHover={{ scale: 1.1 }} onClick={onClose}
            style={{ backgroundColor: '#CF0A0A22', border: 'none', color: '#CF0A0A', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
            <X size={18} />
          </motion.button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* ===== BUYER INFO ===== */}
          {[
            { key: 'name', label: 'Customer Name', placeholder: 'e.g. Ali Hassan', type: 'text' },
            { key: 'phone', label: 'Phone Number', placeholder: '03XX-XXXXXXX', type: 'text' },
            { key: 'cnic', label: 'CNIC Number', placeholder: 'XXXXX-XXXXXXX-X', type: 'text' },
            { key: 'product', label: 'Product Name', placeholder: 'e.g. iPhone 14 Pro', type: 'text' },
            { key: 'productPrice', label: 'Product Price (Rs.)', placeholder: '100000', type: 'number' },
            { key: 'profitPct', label: 'Profit % (e.g. 30)', placeholder: '30', type: 'number' },
            { key: 'downPayment', label: 'Down Payment (Rs.)', placeholder: '20000', type: 'number' },
            { key: 'months', label: 'Duration (Months)', placeholder: '6', type: 'number' },
            { key: 'startDate', label: 'Start Date', placeholder: '', type: 'date' },
          ].map(field => (
            <div key={field.key}>
              <label style={labelStyle}>{field.label}</label>
              <input
                type={field.type} placeholder={field.placeholder} value={form[field.key]}
                onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}

          {/* ===== GUARANTOR SECTION ===== */}
          <div style={{
            border: '1px solid #DC5F0055',
            borderRadius: '14px',
            padding: '16px',
            marginTop: '4px',
            backgroundColor: '#0f0a00',
          }}>
            <p style={{ color: '#DC5F00', fontSize: '12px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '24px', height: '1px', backgroundColor: '#DC5F00' }} />
              Guarantor Info
              <span style={{ display: 'inline-block', width: '24px', height: '1px', backgroundColor: '#DC5F00' }} />
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'guarantorName', label: 'Guarantor Name', placeholder: 'e.g. Usman Khan', type: 'text' },
                { key: 'guarantorPhone', label: 'WhatsApp Number', placeholder: '03XX-XXXXXXX', type: 'text' },
                { key: 'guarantorCnic', label: 'Guarantor CNIC', placeholder: 'XXXXX-XXXXXXX-X', type: 'text' },
                { key: 'guarantorAddress', label: 'Address', placeholder: 'e.g. House 5, Street 3, Peshawar', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ ...labelStyle, color: '#DC5F00aa' }}>{field.label}</label>
                  <input
                    type={field.type} placeholder={field.placeholder} value={form[field.key]}
                    onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                    style={{ ...inputStyle, border: '1px solid #DC5F0033' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Calculation */}
        {price > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ backgroundColor: '#111111', border: '1px solid #B8960C33', borderRadius: '12px', padding: '14px', marginTop: '16px' }}>
            <p style={{ color: '#B8960C', fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>📊 Live Calculation</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                ['Total Amount', `Rs. ${Math.round(total).toLocaleString()}`],
                ['Profit', `Rs. ${Math.round(profitAmt).toLocaleString()}`],
                ['Monthly', `Rs. ${Math.round(monthly).toLocaleString()}`],
                ['Months', `${months}`],
              ].map(([l, v]) => (
                <div key={l} style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '8px' }}>
                  <p style={{ color: '#EEEEEE44', fontSize: '10px' }}>{l}</p>
                  <p style={{ color: '#CF0A0A', fontWeight: 700, fontSize: '13px' }}>{v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px #CF0A0A66' }} whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={saving}
          style={{ width: '100%', marginTop: '16px', backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '13px', fontWeight: 700, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Add Installment ✓'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

function CustomerDetail({ customer, onBack, onPayment }) {
  const { total, monthly, profit } = calcInstallment(
    customer.productPrice, customer.profitPct, customer.downPayment, customer.months
  )
  const paidMonths = (customer.payments || []).filter(Boolean).length
  const paidAmount = customer.downPayment + paidMonths * monthly
  const remainingBalance = total - paidAmount
  const [showInvoice, setShowInvoice] = useState(false)

  return (
    <div>
      <AnimatePresence>{showInvoice && <InvoiceModal customer={customer} onClose={() => setShowInvoice(false)} />}</AnimatePresence>

      <motion.button whileHover={{ x: -4 }} onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: '1px solid #333', color: '#EEEEEE', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', marginBottom: '20px', fontSize: '14px' }}>
        <ArrowLeft size={16} /> Back to Installments
      </motion.button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Amount', value: `Rs. ${Math.round(total).toLocaleString()}`, color: '#B8960C' },
          { label: 'Profit Earned', value: `Rs. ${Math.round(profit).toLocaleString()}`, color: '#22c55e' },
          { label: 'Monthly Install.', value: `Rs. ${Math.round(monthly).toLocaleString()}`, color: '#CF0A0A' },
          { label: 'Amount Paid', value: `Rs. ${Math.round(paidAmount).toLocaleString()}`, color: '#3b82f6' },
          { label: 'Remaining Balance', value: `Rs. ${Math.round(remainingBalance).toLocaleString()}`, color: '#f59e0b' },
          { label: 'Months Left', value: `${customer.months - paidMonths} months`, color: '#8b5cf6' },
        ].map((card, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ y: -3, boxShadow: `0 8px 20px ${card.color}33` }}
            style={{ backgroundColor: '#111111', border: `1px solid ${card.color}33`, borderRadius: '14px', padding: '16px' }}>
            <p style={{ color: '#EEEEEE44', fontSize: '11px', marginBottom: '6px' }}>{card.label}</p>
            <p style={{ color: card.color, fontWeight: 900, fontSize: '16px' }}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ===== MONTHLY PAYMENTS ===== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ backgroundColor: '#111111', border: '1px solid #22c55e22', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontWeight: 700, fontSize: '15px', margin: 0 }}>Monthly Payments</p>
          <motion.button whileHover={{ scale: 1.03 }} onClick={() => setShowInvoice(true)}
            style={{ backgroundColor: '#CF0A0A22', color: '#CF0A0A', border: '1px solid #CF0A0A44', borderRadius: '8px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
            📄 View & Print Invoice
          </motion.button>
        </div>
        <p style={{ color: '#EEEEEE44', fontSize: '12px', marginBottom: '14px' }}>
          {paidMonths} paid out of {customer.months} months — click to mark paid
        </p>
        <div style={{ backgroundColor: '#222', borderRadius: '10px', height: '8px', marginBottom: '18px', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${(paidMonths / customer.months) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ height: '100%', background: 'linear-gradient(to right, #CF0A0A, #22c55e)', borderRadius: '10px' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
          {(customer.payments || []).map((paid, idx) => (
            <motion.div key={idx}
              whileHover={{ scale: paid ? 1 : 1.04 }}
              whileTap={{ scale: paid ? 1 : 0.96 }}
              onClick={() => !paid && onPayment(customer.id, idx)}
              style={{
                backgroundColor: paid ? '#22c55e22' : '#1a1a1a',
                border: `1px solid ${paid ? '#22c55e55' : '#333'}`,
                borderRadius: '10px', padding: '12px',
                cursor: paid ? 'default' : 'pointer', transition: 'all 0.2s'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#EEEEEE55', fontSize: '11px' }}>Month {idx + 1}</span>
                {paid ? <CheckCircle size={14} style={{ color: '#22c55e' }} /> : <Circle size={14} style={{ color: '#333' }} />}
              </div>
              <p style={{ color: paid ? '#22c55e' : '#EEEEEE88', fontWeight: 700, fontSize: '13px' }}>
                Rs. {Math.round(monthly).toLocaleString()}
              </p>
              <p style={{ color: paid ? '#22c55e77' : '#EEEEEE33', fontSize: '10px', marginTop: '2px' }}>
                {paid ? '✓ Paid' : 'Click to Pay'}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ===== CUSTOMER DETAILS CARD ===== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ backgroundColor: '#111111', border: '1px solid #CF0A0A22', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#CF0A0A22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👤</div>
          <div>
            <p style={{ fontWeight: 800, fontSize: '15px', color: '#CF0A0A', margin: 0 }}>Customer Details</p>
            <p style={{ color: '#EEEEEE33', fontSize: '11px', margin: 0 }}>Buyer information & plan</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Full Name', value: customer.name, icon: '🪪' },
            { label: 'Phone', value: customer.phone || '—', icon: '📞' },
            { label: 'CNIC', value: customer.cnic || '—', icon: '🪪' },
            { label: 'Product', value: customer.product, icon: '📦' },
            { label: 'Product Price', value: `Rs. ${customer.productPrice?.toLocaleString()}`, icon: '💰' },
            { label: 'Profit %', value: `${customer.profitPct}%`, icon: '📈' },
            { label: 'Down Payment', value: `Rs. ${customer.downPayment?.toLocaleString()}`, icon: '💳' },
            { label: 'Duration', value: `${customer.months} months`, icon: '📅' },
            { label: 'Start Date', value: customer.startDate || '—', icon: '🗓️' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ backgroundColor: '#1a1a1a', border: '1px solid #CF0A0A11', borderRadius: '10px', padding: '12px 14px' }}>
              <p style={{ color: '#EEEEEE33', fontSize: '10px', marginBottom: '4px' }}>{icon} {label}</p>
              <p style={{ color: '#EEEEEE', fontWeight: 600, fontSize: '13px' }}>{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ===== GUARANTOR DETAILS CARD ===== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ backgroundColor: '#111111', border: '1px solid #DC5F0033', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#DC5F0022', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🛡️</div>
          <div>
            <p style={{ fontWeight: 800, fontSize: '15px', color: '#DC5F00', margin: 0 }}>Guarantor Information</p>
            <p style={{ color: '#EEEEEE33', fontSize: '11px', margin: 0 }}>
              {customer.guarantorName ? 'Guarantor details for this installment' : 'No guarantor added for this record'}
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Full Name', value: customer.guarantorName || '—', icon: '👤' },
            { label: 'WhatsApp', value: customer.guarantorPhone || '—', icon: '📱' },
            { label: 'CNIC', value: customer.guarantorCnic || '—', icon: '🪪' },
            { label: 'Address', value: customer.guarantorAddress || '—', icon: '📍' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ backgroundColor: '#1a1a1a', border: '1px solid #DC5F0022', borderRadius: '10px', padding: '12px 14px' }}>
              <p style={{ color: '#EEEEEE33', fontSize: '10px', marginBottom: '4px' }}>{icon} {label}</p>
              <p style={{ color: customer.guarantorName ? '#EEEEEE' : '#EEEEEE33', fontWeight: 600, fontSize: '13px' }}>{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}

function Installments() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'installments'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData = snapshot.docs.map(doc => {
        const data = doc.data()
        const payments = Array.isArray(data.payments) ? data.payments : Array(data.months || 6).fill(false)
        return { id: doc.id, ...data, payments, createdAt: data.createdAt?.toDate?.() || new Date() }
      })
      setCustomers(customersData)
      setLoading(false)
    }, (error) => {
      console.error('Installments fetch error:', error)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handlePayment = async (customerId, monthIdx) => {
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer || customer.payments[monthIdx]) return
      const newPayments = [...customer.payments]
      newPayments[monthIdx] = true
      await updateDoc(doc(db, 'installments', customerId), { payments: newPayments, updatedAt: serverTimestamp() })
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, payments: newPayments } : c))
      setSelectedCustomer(prev => prev?.id === customerId ? { ...prev, payments: newPayments } : prev)
    } catch (error) {
      console.error('Payment update error:', error)
      alert('Error updating payment.')
    }
  }

  const handleAdd = async (newCustomer) => {
    try {
      await addDoc(collection(db, 'installments'), { ...newCustomer, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    } catch (error) {
      console.error('Installment add error:', error)
      alert('Error adding installment.')
    }
  }

  const totalBalance = customers.reduce((acc, c) => {
    const { total, monthly } = calcInstallment(c.productPrice, c.profitPct, c.downPayment, c.months)
    const paidMonths = (c.payments || []).filter(Boolean).length
    return acc + (total - c.downPayment - paidMonths * monthly)
  }, 0)

  const totalProfit = customers.reduce((acc, c) => {
    const { profit } = calcInstallment(c.productPrice, c.profitPct, c.downPayment, c.months)
    return acc + profit
  }, 0)

  if (selectedCustomer) {
    return (
      <AdminLayout>
        <CustomerDetail customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} onPayment={handlePayment} />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>
        {showAddModal && <AddCustomerModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '4px' }}>
            Installment <span style={{ color: '#CF0A0A' }}>Manager</span>
          </h1>
          <p style={{ color: '#EEEEEE44', fontSize: '13px' }}>Manage all installment plans & payments</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #CF0A0A66' }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> New Installment
        </motion.button>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#EEEEEE33' }}>
          <Loader2 size={40} style={{ margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite', color: '#CF0A0A' }} />
          <p style={{ fontSize: '14px' }}>Loading installments...</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {[
              { label: 'Total Customers', value: customers.length, color: '#3b82f6', prefix: '' },
              { label: 'Total Remaining Balance', value: Math.round(totalBalance), color: '#f59e0b', prefix: 'Rs. ' },
              { label: 'Total Profit', value: Math.round(totalProfit), color: '#22c55e', prefix: 'Rs. ' },
            ].map((card, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: `0 8px 25px ${card.color}33` }}
                style={{ backgroundColor: '#111111', border: `1px solid ${card.color}33`, borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: card.color + '22', filter: 'blur(15px)' }} />
                <p style={{ color: '#EEEEEE44', fontSize: '12px', marginBottom: '8px' }}>{card.label}</p>
                <p style={{ color: card.color, fontWeight: 900, fontSize: '22px' }}>{card.prefix}{card.value.toLocaleString()}</p>
              </motion.div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {customers.map((customer, i) => {
              const { total, monthly } = calcInstallment(customer.productPrice, customer.profitPct, customer.downPayment, customer.months)
              const paidMonths = (customer.payments || []).filter(Boolean).length
              const paidAmount = customer.downPayment + paidMonths * monthly
              const remainingBalance = total - paidAmount
              const progress = customer.months > 0 ? (paidMonths / customer.months) * 100 : 0

              return (
                <motion.div key={customer.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -2, borderColor: '#CF0A0A55' }}
                  style={{ backgroundColor: '#111111', border: '1px solid #222', borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ backgroundColor: '#CF0A0A22', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, color: '#CF0A0A', flexShrink: 0 }}>
                        {customer.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>{customer.name}</p>
                        <p style={{ color: '#EEEEEE55', fontSize: '12px' }}>{customer.product}</p>
                        <p style={{ color: '#EEEEEE33', fontSize: '11px' }}>{customer.phone}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Total', value: `Rs. ${Math.round(total).toLocaleString()}`, color: '#B8960C' },
                        { label: 'Remaining', value: `Rs. ${Math.round(remainingBalance).toLocaleString()}`, color: '#f59e0b' },
                        { label: 'Monthly', value: `Rs. ${Math.round(monthly).toLocaleString()}`, color: '#CF0A0A' },
                        { label: 'Progress', value: `${paidMonths}/${customer.months}`, color: '#22c55e' },
                      ].map(stat => (
                        <div key={stat.label} style={{ textAlign: 'center' }}>
                          <p style={{ color: stat.color, fontWeight: 700, fontSize: '14px' }}>{stat.value}</p>
                          <p style={{ color: '#EEEEEE33', fontSize: '10px' }}>{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 0 15px #CF0A0A44' }} whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCustomer(customer)}
                      style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                      Details →
                    </motion.button>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ backgroundColor: '#222', borderRadius: '10px', height: '6px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        style={{ height: '100%', background: 'linear-gradient(to right, #CF0A0A, #22c55e)', borderRadius: '10px' }}
                      />
                    </div>
                    <p style={{ color: '#EEEEEE33', fontSize: '10px', marginTop: '4px' }}>{Math.round(progress)}% complete</p>
                  </div>
                </motion.div>
              )
            })}

            {customers.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '60px 20px', color: '#EEEEEE33' }}>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>No installments found</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>Add your first installment customer</p>
              </motion.div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}

export default Installments