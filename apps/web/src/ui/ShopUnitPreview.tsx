import React, { useState, useEffect } from 'react';
import { UnitDefinition } from '@tiny-tactics/shared';
import { UnitPortraitGenerator } from '../game/units/UnitPortraitGenerator.js';

interface ShopUnitPreviewProps {
  unitDef: UnitDefinition;
}

export const ShopUnitPreview: React.FC<ShopUnitPreviewProps> = ({ unitDef }) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const frames = React.useMemo(() => UnitPortraitGenerator.getFrames(unitDef), [unitDef]);

  useEffect(() => {
    if (frames.length === 0) return;

    // Cycle through turntable frames at ~12fps (80ms per frame)
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, 80);

    return () => clearInterval(interval);
  }, [frames]);

  if (frames.length === 0) {
    return <div className="w-[110px] h-[90px]" />;
  }

  return (
    <div className="w-[110px] h-[90px] flex items-center justify-center overflow-hidden pointer-events-none select-none">
      <img
        src={frames[frameIndex]}
        alt={unitDef.name}
        className="w-[100px] h-[85px] object-contain drop-shadow-md"
        draggable={false}
      />
    </div>
  );
};
