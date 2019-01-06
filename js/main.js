// Get content of GLSL files
function loadText(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.overrideMimeType("text/plain");
    xhr.send(null);
    if(xhr.status === 200)
        return xhr.responseText;
    else {
        return null;
    }
}

var canvas, gl, program;

var attribPos, attribColor, uniformPerspectiveMat,
    uniformTranslationMat, uniformRotationMat, uniformScaleMat;

var buffers = [],
    vertexPositions = [],
    vertexColors = [];

var translationValues = {x: 0, y: 0, z: 0};
var rotationValues = {x: 0, y: 0, z: 0};
var scaleFactor = 1.0;
var yFov = 75;
var cubeColor, altCubeColor;

var xTranslationInput, yTranslationInput, zTranslationInput,
    xRotationInput, yRotationInput, zRotationInput,
    scaleFactorInput, yFovInput, mousePressed = false,
    colorPickerWrapper, colorPicker, currentColorElt, selectedColor = '#FFFFFF';

function initContext() {
    canvas = document.getElementById('dawin-webgl');
    gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('ERREUR : Échec du chargement du contexte');
        return;
    }
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
}

function setCanvasResolution() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function initShaders() {
    var vertexShaderSource = loadText("glsl/vertex.glsl");
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);

    var fragmentShaderSource = loadText("glsl/fragment.glsl");
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
    }

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(fragmentShader));
    }

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(program));
    }

    gl.useProgram(program);
}

function initAttributes() {
    attribPos = gl.getAttribLocation(program, "position");
    attribColor = gl.getAttribLocation(program, "vertexColor");

    uniformPerspectiveMat = gl.getUniformLocation(program, "perspective");
    uniformTranslationMat = gl.getUniformLocation(program, "translation");
    uniformRotationMat = gl.getUniformLocation(program, "rotation");
    uniformScaleMat = gl.getUniformLocation(program, "scale");
}

function initPerspective() {
    setCanvasResolution();

    var perspectiveMat = mat4.create();

    var fieldOfView = yFov * Math.PI / 180;
    var aspect = canvas.clientWidth / canvas.clientHeight;
    mat4.perspective(perspectiveMat, fieldOfView, aspect, 0.1, 100.0);

    gl.uniformMatrix4fv(uniformPerspectiveMat, false, perspectiveMat);
}

function setCube() {
    vertexPositions = [
        // Face
        -1.0, -1.0,  1.0, 1.0,  1.0,  1.0, 1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0, 1.0,  1.0,  1.0, -1.0,  1.0,  1.0,
        // Back
        -1.0, -1.0, -1.0, 1.0,  1.0, -1.0, -1.0,  1.0, -1.0,
        -1.0, -1.0, -1.0, 1.0,  1.0, -1.0, 1.0, -1.0, -1.0,
        // Up
        -1.0,  1.0, -1.0, 1.0,  1.0,  1.0, -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0, 1.0,  1.0,  1.0, 1.0,  1.0, -1.0,
        // Down
        -1.0, -1.0, -1.0, 1.0, -1.0,  1.0, 1.0, -1.0, -1.0,
        -1.0, -1.0, -1.0, 1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
        // Right
        1.0, -1.0, -1.0, 1.0,  1.0,  1.0, 1.0,  1.0, -1.0,
        1.0, -1.0, -1.0, 1.0,  1.0,  1.0, 1.0, -1.0,  1.0,
        // Left
        -1.0, -1.0, -1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0,
        -1.0, -1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0
    ];

    vertexColors = [
        Array(6).fill([0.0, 0.0, 1.0]).flat(),   
        Array(6).fill([1.0, 0.0, 0.0]).flat(), 
        Array(6).fill([0.29, 0.0, 0.5]).flat(),   
        Array(6).fill([1.0, 1.0, 0.0]).flat(), 
        Array(6).fill([0.0, 1.0, 0.0]).flat(),
        Array(6).fill([1.0, 0.54, 0.0]).flat(),
    ].flat();
}

function initBuffers() {
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribColor);
    buffers["color"] = colorBuffer;

    var posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribPos);
    buffers["pos"] = posBuffer;
}

function initInputs() {
    xTranslationInput = document.getElementById('xTranslationInput');
    xTranslationInput.addEventListener('input', function () {
        translationValues.x = this.value;
    });

    yTranslationInput = document.getElementById('yTranslationInput');
    yTranslationInput.addEventListener('input', function () {
        translationValues.y = this.value;
    });

    zTranslationInput = document.getElementById('zTranslationInput');
    zTranslationInput.addEventListener('input', function () {
        translationValues.z = this.value;
    });

    xRotationInput = document.getElementById('xRotationInput');
    xRotationInput.addEventListener('input', function () {
        rotationValues.x = this.value;
    });

    yRotationInput = document.getElementById('yRotationInput');
    yRotationInput.addEventListener('input', function () {
        rotationValues.y = this.value;
    });

    zRotationInput = document.getElementById('zRotationInput');
    zRotationInput.addEventListener('input', function () {
        rotationValues.z = this.value;
    });

    scaleFactorInput = document.getElementById('scaleFactorInput');
    scaleFactorInput.addEventListener('input', function () {
        scaleFactor = this.value;
    });

    yFovInput = document.getElementById('yFovInput');
    yFovInput.addEventListener('input', function () {
        yFov = this.value;
        initPerspective();
    });

    currentColorElt = document.getElementById('currentHexColor');
    colorPickerWrapper = document.getElementById('colorPicker');
    initColorPicker();
}

function initColorPicker() {
    colorPickerWrapper.innerHTML = '';

    colorPicker = new iro.ColorPicker(colorPickerWrapper, {
        color: selectedColor
    });

    colorPicker.on("color:change", function(color) {
      selectedColor = color.hexString.toUpperCase();
      currentColorElt.innerText = selectedColor;

      cubeColor = Object.values(color.rgb).map(comp => comp / 255);
      altCubeColor = cubeColor.map(color => { return (color > 0.85) ? color - 0.1 : color + 0.1 });
      refreshColor();
    });
}

function initMouseEvents() {
    canvas.addEventListener('wheel', function (e) {
        e.preventDefault();

        scaleFactor = (e.deltaY > 0) ? Math.min(scaleFactor + 0.02, 5)
                                     : Math.max(scaleFactor - 0.02, 0.1);

        scaleFactorInput.value = scaleFactor;
    });

    canvas.addEventListener('mousedown', function () {
        mousePressed = true;
    });

    canvas.addEventListener('mouseup', function () {
        mousePressed = false;
    });

    canvas.addEventListener('mouseleave', function () {
        mousePressed = false;
    });

    canvas.addEventListener('mousemove', function (e) {
        if (!mousePressed) {
            return;
        }
        rotationValues.x -= (event.movementY / 100);
        rotationValues.x = rotationValues.x - 2 * Math.PI * Math.floor((rotationValues.x + Math.PI) / (2 * Math.PI))
        xRotationInput.value = rotationValues.x;

        rotationValues.y -= (event.movementX / 100);
        rotationValues.y = rotationValues.y - 2 * Math.PI * Math.floor((rotationValues.y + Math.PI) / (2 * Math.PI))
        yRotationInput.value = rotationValues.y;
    });
}

function refreshColor() {
    vertexColors = [
        Array(12).fill([altCubeColor[0], cubeColor[1], cubeColor[2]]).flat(),
        Array(12).fill([cubeColor[0], altCubeColor[1], cubeColor[2]]).flat(),
        Array(12).fill([cubeColor[0], cubeColor[1], altCubeColor[2]]).flat()
    ].flat();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers["color"]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
}

function refreshTransformations() {
    var rotationMat = mat4.create();
    mat4.rotateX(rotationMat, rotationMat, -rotationValues.x);
    mat4.rotateY(rotationMat, rotationMat, -rotationValues.y);
    mat4.rotateZ(rotationMat, rotationMat, -rotationValues.z);
    gl.uniformMatrix4fv(uniformRotationMat, false, rotationMat);

    var translationMat = mat4.create();
    var translationVec = vec3.fromValues(translationValues.x, translationValues.y, translationValues.z - 5);
    mat4.fromTranslation(translationMat, translationVec);
    gl.uniformMatrix4fv(uniformTranslationMat, false, translationMat);

    var scaleMat = mat4.create();
    var scaleVec = vec3.fromValues(scaleFactor, scaleFactor, scaleFactor, 1);
    mat4.fromScaling(scaleMat, scaleVec);
    gl.uniformMatrix4fv(uniformScaleMat, false, scaleMat);
}

function draw() {
    refreshTransformations();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, vertexPositions.length / 3);
    requestAnimationFrame(draw);
}

function main() {
    initContext();
    initShaders();
    initAttributes();
    initPerspective();

    setCube();
    initBuffers();
    initInputs();
    initMouseEvents();

    draw();

    window.addEventListener('resize', function() {
        initPerspective();
        initColorPicker(); 
    });
}