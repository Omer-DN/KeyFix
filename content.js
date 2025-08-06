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

document.addEventListener('mousemove', (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

function createFloatingButton() {
  if (floatingBtn) return;

  floatingBtn = document.createElement('button');
  floatingBtn.style.position = 'fixed';
  floatingBtn.style.zIndex = '2147483647';
  floatingBtn.style.padding = '0';
  floatingBtn.style.margin = '0';
  floatingBtn.style.border = '1px solid rgba(0, 0, 0, 0.2)';
  floatingBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
  floatingBtn.style.borderRadius = '4px';
  floatingBtn.style.width = '24px';
  floatingBtn.style.height = '24px';
  floatingBtn.style.boxSizing = 'border-box';
  floatingBtn.style.cursor = 'pointer';

  const img = document.createElement('img');
  img.src = chrome.runtime.getURL('transTo.png');
  img.alt = 'Convert';
  img.style.width = '20px';
  img.style.height = '20px';
  img.style.display = 'block';
  img.style.margin = '0';
  img.style.padding = '0';

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
      let editableElement = null;

      if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
        editableElement = range.commonAncestorContainer.parentElement.closest('[contenteditable=true]');
      } else if (range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE) {
        editableElement = range.commonAncestorContainer.closest('[contenteditable=true]');
      }

      if (editableElement || document.activeElement.isContentEditable) {
        range.deleteContents();
        range.insertNode(document.createTextNode(converted));

        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStart(range.endContainer, range.endOffset);
        newRange.collapse(true);
        selection.addRange(newRange);

        replaced = true;
      } else {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          const start = active.selectionStart;
          const end = active.selectionEnd;
          const val = active.value;
          active.value = val.slice(0, start) + converted + val.slice(end);
          active.selectionStart = active.selectionEnd = start + converted.length;
          replaced = true;
        } else {
          range.deleteContents();
          range.insertNode(document.createTextNode(converted));
          replaced = true;
        }
      }
    } catch (err) {
      console.warn("❌ לא ניתן להחליף טקסט, עובר להעתקה ללוח", err);
      replaced = false;
    }

    try {
      await navigator.clipboard.writeText(converted);
    } catch (e) {
      console.warn("❌ שגיאה בהעתקת הטקסט ללוח", e);
    }
let alreadyShown = true;

/*if (alreadyShown) {
    alert("✔️ הטקסט תורגם והועתק ללוח. הודעה זו לא תוצג בעתיד");
    alreadyShown = false;
} else if (!shouldShowMessage) {
    alert("✔️ לא הצלחנו להחליף בטקסט ישירות, אבל הטקסט תורגם והועתק ללוח. תוכל להדביק (Ctrl+V).");
}*/



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
    if (!floatingBtn) createFloatingButton();

    let x = lastMouseX;
    let y = lastMouseY - 40;

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect && rect.width > 0 && rect.height > 0) {
        x = rect.left;
        y = rect.top - 40;
      }
    } catch (e) {
      // נשאר עם מיקום העכבר
    }

    const maxX = window.innerWidth - 40;
    const maxY = window.innerHeight - 40;
    if (x > maxX) x = maxX;
    if (y < 0) y = 0;
    if (y > maxY) y = maxY;

    showButtonAt(x, y);
  } else {
    hideButton();
  }
});
