"use client"
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { GripVertical } from 'lucide-react';

const DraggableItem = ({ id, index, name, moveBoardItem }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'BOARD',
    item: () => ({ id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'BOARD',
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveBoardItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <li
      ref={ref}
      className={`flex items-center p-2 bg-gray-100 dark:bg-background dark:border dark:border-gray-300 rounded mb-2 ${isDragging ? 'opacity-50' : ''}`}
      style={{ touchAction: 'none' }}
    >
      <span className="mr-2 cursor-move">
        <GripVertical size={20} />
      </span>
      {name}
    </li>
  );
};

const ReorderBoardsComponent = ({ boards, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reorderedBoards, setReorderedBoards] = useState(boards);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const moveBoardItem = useCallback((dragIndex, hoverIndex) => {
    setReorderedBoards((prevBoards) => {
      const updatedBoards = [...prevBoards];
      const [reorderedItem] = updatedBoards.splice(dragIndex, 1);
      updatedBoards.splice(hoverIndex, 0, reorderedItem);
      return updatedBoards;
    });
  }, []);

  const handleSave = () => {
    const reorderedIds = reorderedBoards.map(board => board.id);
    onSave(reorderedIds);
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Reorder Boards</Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reorder Boards</DialogTitle>
          </DialogHeader>
          <DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend}>
            <div className="max-h-[60vh] overflow-y-auto">
              <ul ref={listRef} className="space-y-2">
                {reorderedBoards.map((board, index) => (
                  <DraggableItem
                    key={board.id}
                    id={board.id}
                    index={index}
                    name={board.name}
                    moveBoardItem={moveBoardItem}
                  />
                ))}
              </ul>
            </div>
          </DndProvider>
          <DialogFooter>
            <Button onClick={handleSave}>Save Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReorderBoardsComponent;
