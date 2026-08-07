import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export default function TrendingLocations({ locations = [] }) {
  const navigate = useNavigate();

  const displayLocations = locations.length > 0 ? locations : [
    { name: 'South Bopal, Ahmedabad', score: 98 },
    { name: 'Satellite, Ahmedabad', score: 94 },
    { name: 'Science City, Ahmedabad', score: 91 },
    { name: 'Prahlad Nagar, Ahmedabad', score: 88 },
    { name: 'Bodakdev, Ahmedabad', score: 85 },
  ];

  const handleLocationClick = (locName) => {
    // Extract base locality name (e.g. "South Bopal" from "South Bopal, Ahmedabad")
    const cleanLocality = locName.split(',')[0].trim();
    navigate(`${ROUTES.PROPERTIES}?locality=${encodeURIComponent(cleanLocality)}`);
  };

  return (
    <div className="bg-surface-container-lowest rounded-[12px] shadow-ambient border border-outline-variant/30 p-md flex flex-col">
      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-4">
        Trending Locations
      </h3>
      <ul className="flex flex-col gap-3">
        {displayLocations.map((loc, idx) => (
          <li 
            key={loc.name || idx}
            onClick={() => handleLocationClick(loc.name)}
            className="flex items-center justify-between p-2 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center text-on-surface-variant font-semibold text-sm shrink-0">
                {idx + 1}
              </div>
              <div>
                <div className="font-body-md text-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                  {loc.name}
                </div>
                <div className="font-body-sm text-body-sm text-secondary">
                  Demand Score: {loc.score}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-tertiary">trending_up</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
