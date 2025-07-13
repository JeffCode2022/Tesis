declare module 'react-sparklines' {
  import * as React from 'react';
  export interface SparklinesProps {
    data: number[];
    limit?: number;
    width?: number;
    height?: number;
    margin?: number;
    min?: number;
    max?: number;
    style?: React.CSSProperties;
    svgWidth?: number | string;
    svgHeight?: number | string;
    preserveAspectRatio?: string;
    onMouseMove?: (event: React.MouseEvent<SVGElement, MouseEvent>) => void;
    children?: React.ReactNode;
  }
  export class Sparklines extends React.Component<SparklinesProps> {}
  export interface SparklinesLineProps {
    color?: string;
    style?: React.CSSProperties;
  }
  export class SparklinesLine extends React.Component<SparklinesLineProps> {}
} 