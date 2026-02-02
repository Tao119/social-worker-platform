"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface Photo {
  id: number | string;
  url: string;
  alt: string;
  file?: File;
}

interface SortablePhotoProps {
  photo: Photo;
  onRemove: (id: number | string) => void;
}

function SortablePhoto({ photo, onRemove }: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="aspect-video relative rounded-lg overflow-hidden group bg-slate-100"
    >
      {/* Drag handle overlay */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
      >
        {/* Drag indicator */}
        <div className="absolute top-2 left-2 bg-black/50 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>

      <img
        src={photo.url}
        alt={photo.alt}
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(photo.id);
        }}
        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-600"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Sort order badge */}
      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        ドラッグで並び替え
      </div>
    </div>
  );
}

interface PhotoOverlayProps {
  photo: Photo | null;
}

function PhotoOverlay({ photo }: PhotoOverlayProps) {
  if (!photo) return null;

  return (
    <div className="aspect-video rounded-lg overflow-hidden shadow-2xl ring-2 ring-[#2b8cee] bg-slate-100">
      <img
        src={photo.url}
        alt={photo.alt}
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}

interface DraggablePhotoGalleryProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  onAddClick: () => void;
}

export default function DraggablePhotoGallery({
  photos,
  onPhotosChange,
  onAddClick,
}: DraggablePhotoGalleryProps) {
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const photo = photos.find((p) => p.id === active.id);
    setActivePhoto(photo || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePhoto(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);
      const newPhotos = arrayMove(photos, oldIndex, newIndex);
      onPhotosChange(newPhotos);
    }
  };

  const handleRemove = (id: number | string) => {
    const newPhotos = photos.filter((p) => p.id !== id);
    onPhotosChange(newPhotos);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
          {photos.map((photo) => (
            <SortablePhoto key={photo.id} photo={photo} onRemove={handleRemove} />
          ))}
        </SortableContext>

        {/* Add button */}
        <button
          onClick={onAddClick}
          className="aspect-video border-2 border-dashed border-[#cfdbe7] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-[#2b8cee] transition-colors"
        >
          <svg className="w-6 h-6 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] mt-1 font-bold text-[#4c739a]">写真を追加</span>
        </button>
      </div>

      <DragOverlay>
        <PhotoOverlay photo={activePhoto} />
      </DragOverlay>
    </DndContext>
  );
}
