const engToHebMap = {
  'a': 'ש', 'b': 'נ', 'c': 'ב', 'd': 'ג', 'e': 'ק', 'f': 'כ', 'g': 'ע',
  'h': 'י', 'i': 'ן', 'j': 'ח', 'k': 'ל', 'l': 'ך', 'm': 'צ', 'n': 'מ',
  'o': 'ם', 'p': 'פ', 'q': '/', 'r': 'ר', 's': 'ד', 't': 'א', 'u': 'ו',
  'v': 'ה', 'w': '\'', 'x': 'ס', 'y': 'ט', 'z': 'ז',
  ',': 'ת', '.': 'ץ', ';': 'ף', '\'': '.', '[': ']', ']': '['
};

const hebToEngMap = Object.fromEntries(
  Object.entries(engToHebMap).map(([eng, heb]) => [heb, eng])
);

function isHebrew(text) {
  return /[א-ת]/.test(text);
}

function convertText(text) {
  const map = isHebrew(text) ? hebToEngMap : engToHebMap;
  return [...text].map(char => {
    const lower = char.toLowerCase();
    const isUpper = char !== lower;
    const mapped = map[lower] || char;
    return isUpper ? mapped.toUpperCase() : mapped;
  }).join('');
}

let floatingBtn = null;
let lastMouseX = 0;
let lastMouseY = 0;

// Track mouse position for fallback placement
document.addEventListener('mousemove', (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

function createFloatingButton() {
  floatingBtn = document.createElement('button');
  floatingBtn.style.position = 'fixed';
  floatingBtn.style.zIndex = '2147483647';
  floatingBtn.style.padding = '4px';
  floatingBtn.style.border = 'none';
  floatingBtn.style.backgroundColor = 'transparent';
  floatingBtn.style.cursor = 'pointer';
  floatingBtn.style.boxShadow = '0 3px 8px rgba(0,0,0,0.3)';
  floatingBtn.style.borderRadius = '6px';

  const img = document.createElement('img');
  img.src = chrome.runtime.getURL('transTo.png');
  img.alt = 'Convert';
  img.style.width = '32px';
  img.style.height = '32px';
  img.style.display = 'block';

  floatingBtn.appendChild(img);
  document.body.appendChild(floatingBtn);

  floatingBtn.addEventListener('click', async () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const selectedText = selection.toString();
    if (!selectedText) return;

    const converted = convertText(selectedText);
    let replaced = false;

    try {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(converted));
      selection.removeAllRanges();
      replaced = true;
    } catch (err) {
      console.warn("❌ לא ניתן להחליף טקסט, עובר להעתקה ללוח", err);
      replaced = false;
    }

    if (!replaced) {
      try {
        await navigator.clipboard.writeText(converted);
        alert("✔️ הטקסט תורגם והועתק. תוכל להדביק עם Ctrl+V.");
      } catch (e) {
        alert("❌ שגיאה בהעתקה. הנה הטקסט המתורגם:\n" + converted);
      }
    }

    hideButton();
  });
}

function showButtonAt(x, y) {
  if (!floatingBtn) return;
  floatingBtn.style.left = `${x}px`;
  floatingBtn.style.top = `${y}px`;
  floatingBtn.style.display = 'block';
}

function hideButton() {
  if (floatingBtn) {
    floatingBtn.style.display = 'none';
  }
}

document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text.length > 0) {
    console.log("📌 טקסט שסומן:", text);
    if (!floatingBtn) createFloatingButton();

    let x = lastMouseX;
    let y = lastMouseY - 40;

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      console.log("📏 rect:", rect);

      if (rect && rect.width > 0 && rect.height > 0) {
        x = rect.left;
        y = rect.top - 40;
      } else {
        console.log("🟡 rect ריק, נשתמש במיקום העכבר");
      }
    } catch (e) {
      console.log("⚠️ שגיאה ב-getRangeAt, נשתמש במיקום העכבר", e);
    }

    showButtonAt(x, y);
  } else if (floatingBtn) {
    hideButton();
  }
});
