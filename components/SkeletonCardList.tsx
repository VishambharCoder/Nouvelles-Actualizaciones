import React from 'react';
import SkeletonCard from './SkeletonCard'; // Import SkeletonCard

// interface SkeletonCardProps was removed as it's defined in SkeletonCard.tsx
// The local const SkeletonCard definition was removed.

interface SkeletonCardListProps {
    count: number;
    message?: string;
}

const SkeletonCardList: React.FC<SkeletonCardListProps> = ({ count, message }) => {
    return (
        // Removed outer padding from this div. Page padding is handled by App.tsx <main>.
        <div> 
            {message && <p className="text-center text-gray-500 dark:text-gray-400 my-4">{message}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: count }).map((_, index) => (
                    <SkeletonCard key={index} /> // Now uses the imported SkeletonCard
                ))}
            </div>
        </div>
    );
};

export default SkeletonCardList;