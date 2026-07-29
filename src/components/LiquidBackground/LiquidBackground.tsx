import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export const LiquidBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const current = mountRef.current
    if (!current) return

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.style.position = 'fixed'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.style.width = '100vw'
    renderer.domElement.style.height = '100vh'
    renderer.domElement.style.zIndex = '0'
    renderer.domElement.style.pointerEvents = 'none'
    current.appendChild(renderer.domElement)

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_resolution;

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          vec2 pos = uv - 0.5;
          float t = u_time * 0.45;

          float wave1 = sin(pos.x * 5.0 + t) * 0.25;
          float wave2 = cos(pos.y * 4.0 + t * 0.8) * 0.22;
          float wave3 = sin((pos.x + pos.y) * 6.0 + t * 0.6) * 0.18;
          float waves = wave1 + wave2 + wave3;

          vec3 blue = vec3(0.36, 0.55, 0.94);
          vec3 purple = vec3(0.56, 0.42, 0.96);
          vec3 bg = vec3(0.96, 0.97, 1.0);

          vec3 color = mix(blue, purple, uv.y + waves * 0.5);
          float glow = 0.55 + waves * 0.8;
          vec3 finalColor = mix(bg, color, glow);
          finalColor += waves * 0.06;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    })

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    let frameId = 0
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      uniforms.u_time.value += 0.012
      renderer.render(scene, camera)
    }

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId)
      } else {
        animate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    if (!document.hidden) animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      renderer.dispose()
      if (current.contains(renderer.domElement)) {
        current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div className="liquid-background" ref={mountRef} />
}