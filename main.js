
const canvas = document.getElementById("glcanvas"),
    gl = canvas.getContext("webgl");


let mousedown = false,
    zoom = 0,
    offset = {x:0, y:0};

const floatString = n => Number.isInteger(n)? n.toFixed(1) : n;

    canvas.addEventListener("mouseup",    () => mousedown = false);
    canvas.addEventListener("mouseleave", () => mousedown = false);
    canvas.addEventListener("mousedown",  () => mousedown = true );
    // if the mouse is down (is dragging the canvas), add the mouse's Δxy to the offset.
    canvas.addEventListener("mousemove", e => {
        if(mousedown){
            offset.x += e.movementX*Math.pow(2, zoom);
            offset.y -= e.movementY*Math.pow(2, zoom);
        }
    });
    // on scroll: 
    canvas.addEventListener("wheel", e => {
        zoom += e.deltaY*0.001;
        let x = (e.offsetX - 600)*Math.pow(2, zoom),
            y = (300 - e.offsetY)*Math.pow(2, zoom);

        offset.x += x*Math.pow(2, e.deltaY*0.001) - x, 
        offset.y += y*Math.pow(2, e.deltaY*0.001) - y
    });


let vertexShader, fragmentShader, program, verts;

init();

function init() {
    // default bg color ig
    gl.clearColor(1.0, 0.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    // turns out you must have a vertex shader even for shadertoy-style stuff;
    // the idea is to make 2 triangles that fill the entire screen, and display stuff on them
    gl.shaderSource(vertexShader,

        `attribute vec2 pos;
         void main(){
             gl_Position = vec4(pos, 0.0, 1.0);
         }
         `);
     gl.compileShader(vertexShader);

         // fragment shader, aka the fun part
    gl.shaderSource(fragmentShader,

    `precision highp float;
    #define TAU 6.28

    uniform highp vec2 offset;
    uniform highp float zoom;

    vec2 f(vec2 z){
        return vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y);
    }
    vec2 df(vec2 z, vec2 h){
        return 2.*vec2(z.x*h.x - z.y*h.y, z.x*h.y + z.y*h.x) + f(h);
    }
    
    void main(){

        vec2 uv = (gl_FragCoord.xy-vec2(600,300))*pow(2.,zoom)/300.;

        float col = 0.0;

        vec2 z0 = -offset/300.;
        vec2 z = vec2(0);
        vec2 h = vec2(0);

        float maxIterations = 20.-20.*zoom;

        for(float i=0.; i<2048.; i++){
            
            h = df(z, h) + uv;
            z = f(z) + z0;

            if (abs(h.x) > 1.0) {
                z.x += h.x;
                h.x = 0.0;
            }
            if (abs(h.y) > 1.0) {
                z.y += h.y;
                h.y = 0.0;
            }
            if(z.x+h.x > 2.){
                col = i/64.;
                break;
            }
            if(i>maxIterations) break;
        }
        gl_FragColor = vec4(0.5 - 0.5*sin(TAU*(-.24+col+.4+vec3(.0,.1,.2))), 1.0);
    }
    `);
gl.compileShader(fragmentShader);

    // some shit I don't really understand 
    program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // those triangles we talked about earlier
    verts = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        
         1, -1,
        -1,  1,
         1,  1
    ])
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    
    gl.useProgram(program);


    loop();
}
function loop() {

    // updates the offset and zoom
    program.position = gl.getUniformLocation(program, "offset");
    gl.uniform2fv(program.position, [offset.x, offset.y]);
    program.position = gl.getUniformLocation(program, "zoom");
    gl.uniform1fv(program.position, [zoom]);

    // uuh triangles idk
    program.position = gl.getAttribLocation(program, "pos");
    gl.enableVertexAttribArray(program.position);
    gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);

    // TRIANGLES
    gl.drawArrays(gl.TRIANGLES,0, verts.length/2);

    // loop
    requestAnimationFrame(loop);
};
