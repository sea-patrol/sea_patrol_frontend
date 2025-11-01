import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';

// Глобальные переменные для хранения состояния камеры
let azimuthAngle = 0;
let polarAngle = Math.PI / 4; // ~45° вверх
let distance = 10;

export default function CameraFollower({ targetRef }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  const [initialized, setInitialized] = useState(false);

  // Инициализация OrbitControls (только для ввода!)
  useEffect(() => {
    const controls = new OrbitControlsImpl(camera, gl.domElement);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.zoomSpeed = 0.6;
    controls.minDistance = 15; // Минимальная дистанция от цели
    controls.maxDistance = 200; // Максимальная дистанция от цели

    // Сохраняем начальные углы и дистанцию
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(camera.position.clone().sub(new THREE.Vector3(0, 0, 0)));
    azimuthAngle = spherical.theta;
    polarAngle = spherical.phi;
    distance = spherical.radius;

    // Перехватываем изменения от OrbitControls
    const originalUpdate = controls.update.bind(controls);
    controls.update = function () {
      const result = originalUpdate();
      // Обновляем глобальные углы из текущей позиции камеры
      const spherical = new THREE.Spherical().setFromVector3(
        camera.position.clone().sub(controls.target)
      );
      azimuthAngle = spherical.theta;
      polarAngle = spherical.phi;
      distance = spherical.radius;
      return result;
    };

    controlsRef.current = controls;
    setInitialized(true);

    return () => controls.dispose();
  }, [camera, gl]);

  useFrame(() => {
    if (!targetRef.current || !initialized) return;

    // Получаем позицию цели
    const targetPos = new THREE.Vector3();
    targetRef.current.getWorldPosition(targetPos);

    // Вычисляем позицию камеры по сферическим координатам
    const cameraOffset = new THREE.Vector3()
      .setFromSphericalCoords(distance, polarAngle, azimuthAngle)
      .add(targetPos);

    // Устанавливаем позицию и направление
    camera.position.copy(cameraOffset);
    camera.lookAt(targetPos);

    // Обновляем цель OrbitControls для корректного ввода
    if (controlsRef.current) {
      controlsRef.current.target.copy(targetPos);
    }
  });

  return null;
}
