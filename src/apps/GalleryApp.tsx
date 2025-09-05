import React from 'react';

const images = [
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800',
  'https://images.unsplash.com/photo-1500534310937-38f36f2fb8e3?w=800',
];

export const GalleryApp: React.FC = () => {
  return (
    <div style={{ padding: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {images.map((src, i) => (
          <img key={i} src={src} alt="Gallery" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }} />
        ))}
      </div>
    </div>
  );
};


