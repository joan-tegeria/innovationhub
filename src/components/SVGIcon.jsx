import React from "react";

// This component helps transform kebab-case SVG attributes to camelCase
// which React requires (like clip-path to clipPath)
const SVGIcon = ({ src, alt, className, ...props }) => {
  if (!src) return null;

  // For imported SVG files, render as an img tag
  if (typeof src === "string") {
    return <img src={src} alt={alt || ""} className={className} {...props} />;
  }

  // For direct SVG content, wrap in a span
  return (
    <span className={className} {...props}>
      {src}
    </span>
  );
};

export default SVGIcon;
