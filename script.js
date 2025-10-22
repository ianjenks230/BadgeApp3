
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const ozScaleSlider = document.getElementById("ozScaleSlider");
const ozScaleValue = document.getElementById("ozScaleValue");

// Badge image paths
const badgeImages = {
    ozpertBadges: {
        bronze: 'badges/ozpert-bronze.png',
        silver: 'badges/ozpert-silver.png',
        gold: 'badges/ozpert-gold.png',
        diamond: 'badges/ozpert-diamond.png'
    },
    coreValues: {
        bePositive: 'badges/be-positive.png',
        empathize: 'badges/empathize.png',
        evolveConstantly: 'badges/evolve-constantly.png',
        focusOnOutcome: 'badges/focus-on-outcome.png',
        succeedAsTeam: 'badges/succeed-as-team.png'
    },
    ozImage: 'badges/OZ.png'
};

let combinedImageBlob = null;

// Function to resize image maintaining aspect ratio
function resizeImage(img, targetWidth, targetHeight) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const imgRatio = img.width / img.height;
    const targetRatio = targetWidth / targetHeight;
    let finalWidth = targetWidth;
    let finalHeight = targetHeight;

    if (imgRatio > targetRatio) {
        finalHeight = targetWidth / imgRatio;
    } else {
        finalWidth = targetHeight * imgRatio;
    }

    const offsetX = (targetWidth - finalWidth) / 2;
    const offsetY = (targetHeight - finalHeight) / 2;
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, targetWidth, targetHeight);
    tempCtx.drawImage(img, offsetX, offsetY, finalWidth, finalHeight);
    return tempCanvas;
}

// Function to add cache busting to image URLs
function getImageUrl(baseUrl) {
    const timestamp = new Date().getTime();
    return `${baseUrl}?v=${timestamp}`;
}

// Function to load an image from URL
function loadImageFromUrl(url) {
    console.log('Loading image from:', url);
    const bustedUrl = getImageUrl(url);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            console.log('Successfully loaded image:', bustedUrl);
            resolve(img);
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${bustedUrl}`);
            reject(new Error(`Failed to load image: ${bustedUrl}`));
        };
        img.src = bustedUrl;
    });
}

// Function to get selected radio button value from a group
function getSelectedValue(name) {
    const radio = document.querySelector(`input[name="${name}"]:checked`);
    return radio ? radio.value : null;
}

// Function to clear all radio button selections
function clearSelections() {
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });
    canvas.width = 0;
    canvas.height = 0;
    combinedImageBlob = null;
    downloadBtn.disabled = true;
    ozScaleSlider.value = 1.5;
    ozScaleValue.textContent = ozScaleSlider.value;
}

// Function to combine images
async function combineImages() {
    const ozpertValue = getSelectedValue('ozpertBadge');
    const coreValue = getSelectedValue('coreValue');
    
    console.log('Selected badges:', { ozpertValue, coreValue });
    
    if (!ozpertValue && !coreValue) {
        canvas.width = 0;
        canvas.height = 0;
        combinedImageBlob = null;
        downloadBtn.disabled = true;
        return;
    }

    try {
        const imagesToLoad = [loadImageFromUrl(badgeImages.ozImage)];
        let totalHeight = 0;
        let standardWidth = 0;

        if (ozpertValue && coreValue) {
            imagesToLoad.push(
                loadImageFromUrl(badgeImages.ozpertBadges[ozpertValue]),
                loadImageFromUrl(badgeImages.coreValues[coreValue])
            );
        } else if (ozpertValue) {
            imagesToLoad.push(loadImageFromUrl(badgeImages.ozpertBadges[ozpertValue]));
        } else if (coreValue) {
            imagesToLoad.push(loadImageFromUrl(badgeImages.coreValues[coreValue]));
        }

        const selectedImages = await Promise.all(imagesToLoad);
        const ozImage = selectedImages[0];
        const ozScaleFactor = parseFloat(ozScaleSlider.value);
        const badgeScaleFactor = 3; // Fixed scale for lower badges

        if (selectedImages.length > 1) {
            standardWidth = Math.max(
                ...selectedImages.slice(1).map(img => Math.max(img.width, img.height))
            ) * badgeScaleFactor;
        }

        const resizedBadges = selectedImages.slice(1).map(img => 
            resizeImage(img, standardWidth, standardWidth)
        );

        const scaledOzWidth = ozImage.width * ozScaleFactor;
        const scaledOzHeight = ozImage.height * ozScaleFactor;
        totalHeight = scaledOzHeight + standardWidth * resizedBadges.length;
        const standardWidthFinal = Math.max(scaledOzWidth, standardWidth);

        canvas.width = standardWidthFinal;
        canvas.height = totalHeight;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, standardWidthFinal, totalHeight);

        ctx.drawImage(ozImage, (standardWidthFinal - scaledOzWidth) / 2, 0, scaledOzWidth, scaledOzHeight);

        resizedBadges.forEach((badge, index) => {
            ctx.drawImage(badge, 0, scaledOzHeight + index * standardWidth);
        });

        canvas.toBlob(blob => {
            combinedImageBlob = blob;
            downloadBtn.disabled = false;
        }, "image/png");
    } catch (error) {
        console.error('Error processing images:', error);
    }
}

// Event listeners for dynamic updates
ozScaleSlider.addEventListener("input", () => {
    ozScaleValue.textContent = ozScaleSlider.value;
    combineImages();
});

document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener("change", combineImages);
});



downloadBtn.addEventListener("click", () => {
    if (!combinedImageBlob) return;
    const url = URL.createObjectURL(combinedImageBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "combined_badges.png";
    a.click();
    URL.revokeObjectURL(url);
});

clearBtn.addEventListener("click", clearSelections);

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}