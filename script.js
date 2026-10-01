async function readMedicineLabel() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const fileInput = document.getElementById('imageInput');
  const btn = document.getElementById('scanBtn');
  const resultBox = document.getElementById('resultBox');

  if (!apiKey) {
    alert('Please paste your Gemini API Key first!');
    return;
  }

  if (!fileInput.files[0]) {
    alert('Please upload a photo of a medicine label!');
    return;
  }

  btn.innerText = 'Analyzing Label with Gemini AI...';
  btn.disabled = true;

  const file = fileInput.files[0];
  const base64Image = await convertToBase64(file);

  let mimeType = file.type || 'image/png';

  try {
    // Updated model endpoint to gemini-3.8-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: mimeType, data: base64Image } },
            { text: "Examine this medicine label photo carefully. Read all text. Respond ONLY in JSON format using these exact keys: medicineName, simpleDosage, warnings (array of strings), whenToTake." }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();

    if (data.error) {
      alert('Gemini API Error: ' + data.error.message);
      return;
    }

    const parsedData = JSON.parse(data.candidates[0].content.parts[0].text);

    document.getElementById('medicineName').innerText = parsedData.medicineName;
    document.getElementById('simpleDosage').innerText = parsedData.simpleDosage;
    document.getElementById('whenToTake').innerText = parsedData.whenToTake;

    const warningsList = document.getElementById('warningsList');
    warningsList.innerHTML = '';
    parsedData.warnings.forEach(warning => {
      const li = document.createElement('li');
      li.innerText = warning;
      warningsList.appendChild(li);
    });

    resultBox.style.display = 'block';

  } catch (error) {
    alert('Error analyzing image. Check browser console (F12) for details.');
    console.error(error);
  } finally {
    btn.innerText = 'Scan & Read Label';
    btn.disabled = false;
  }
}

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}