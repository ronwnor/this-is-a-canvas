
const canvas = document.getElementById("glcanvas"),
    gl = canvas.getContext("webgl");


let mousedown = false,
    zoom = 0,
    offset = {x:0, y:0};

const floatString = n => Number.isInteger(n)? n.toFixed(1) : n;

    canvas.addEventListener("mouseup",    () => mousedown = false);
    canvas.addEventListener("mouseleave", () => mousedown = false);
    canvas.addEventListener("mousedown",  () => mousedown = true );
    canvas.addEventListener("mousemove", e => {
        if(mousedown){
            offset.x += e.movementX*Math.pow(2, zoom);
            offset.y -= e.movementY*Math.pow(2, zoom);
        }
    });
    canvas.addEventListener("wheel", e => {
        zoom += e.deltaY*0.001;
        let x = (e.offsetX - 600)*Math.pow(2, zoom),
            y = (300 - e.offsetY)*Math.pow(2, zoom);
        offset.x += x*Math.pow(2, e.deltaY*0.001) - x, 
        offset.y += y*Math.pow(2, e.deltaY*0.001) - y
    });


let vertexShader, fragmentShader;

init();

function init() {
    // default bg color ig
    gl.clearColor(1.0, 0.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    loop();
}
function loop() {
    

    // turns out you must have a vertex shader even for shadertoy-style stuff;
    // the idea is to make 2 triangles that fill the entire screen, and display shit on them
    gl.shaderSource(vertexShader,
       `attribute vec2 pos;
        void main(){
            gl_Position = vec4(pos, 0.0, 1.0);
        }
        `);
    gl.compileShader(vertexShader);

    // fragment shader, aka the fun part
    gl.shaderSource(fragmentShader, 
        `
        precision highp float;
        void main(){
            
            const float TAU = 6.28318530718; 
            vec2 z  = vec2(0);
            vec3 col = vec3(0);
            vec2 offset = vec2(${floatString(offset.x    )}, ${floatString(offset.y    )});

            vec2 uv = (gl_FragCoord.xy - vec2(600, 300))*pow(2.0, ${floatString(zoom)});
            uv -= offset;

            uv /= 300.;
            uv -= vec2(.5, .0);


            for(float i=0.0; i<1024.0; i++){
                
                z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + uv;
                
                if(z.x > 2. && col == vec3(0)){
                    col += i/64.;
                    break;
                }
            }

            col = 0.5 - 0.5*sin(TAU*(-.24+col+.4+vec3(.0,.1,.2)));

            gl_FragColor = vec4(col, 1.0);
        }
        `);
    gl.compileShader(fragmentShader);

    // some shit I don't really understand 
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // those triangles we talked about earlier
    const verts = new Float32Array([
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

    program.position = gl.getAttribLocation(program, "pos");
    gl.enableVertexAttribArray(program.position);
    gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES,0, verts.length/2);

    requestAnimationFrame(loop);
};
