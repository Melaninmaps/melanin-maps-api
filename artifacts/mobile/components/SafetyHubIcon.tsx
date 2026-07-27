import React from "react";
import Svg, { Path, Circle } from "react-native-svg";

interface Props {
  color: string;
  size?: number;
}

export default function SafetyHubIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Arch — wide semicircle spanning the top, like the golden ring in the logo */}
      <Path
        d="M2 18 A10 10 0 0 1 22 18"
        stroke={color}
        strokeWidth="1.9"
        fill="none"
        strokeLinecap="round"
      />
      {/* Map pin body — teardrop centered inside the arch */}
      <Path
        d="M12 21.5 C9.5 17.8 7.5 16 7.5 13.5 A4.5 4.5 0 0 1 16.5 13.5 C16.5 16 14.5 17.8 12 21.5 Z"
        fill={color}
      />
      {/* White dot inside pin */}
      <Circle cx="12" cy="13.5" r="1.7" fill="white" />
    </Svg>
  );
}
