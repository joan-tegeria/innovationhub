import React from "react";

export default function VisitSPace() {
  return (
    <div style={{ paddingTop: "100px" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100dvh",
          paddingTop: "50px",
          overflow: "hidden",
          maxWidth: "100%",
        }}
      >
        <iframe
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          src="https://innovationhub.zohobookings.eu/portal-embed#/212110000000102016"
          frameBorder="0"
          allowFullScreen=""
        />
      </div>
    </div>
  );
}
