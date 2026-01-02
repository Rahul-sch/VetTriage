import { useState } from "react";

interface EditableListProps {
  items: string[];
  onSave: (items: string[]) => void;
  isEdited?: boolean;
  ordered?: boolean;
  placeholder?: string;
}

export function EditableList({
  items,
  onSave,
  isEdited = false,
  ordered = false,
  placeholder = "No items",
}: EditableListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState(items);

  const handleSave = () => {
    setIsEditing(false);
    const filtered = editItems.filter((item) => item.trim());
    if (JSON.stringify(filtered) !== JSON.stringify(items)) {
      onSave(filtered);
    }
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...editItems];
    newItems[index] = value;
    setEditItems(newItems);
  };

  const handleAddItem = () => {
    setEditItems([...editItems, ""]);
  };

  const handleRemoveItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {editItems.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleItemChange(i, e.target.value)}
              className="flex-1 px-2 py-1 border border-teal-400 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              placeholder={`Item ${i + 1}`}
            />
            <button
              onClick={() => handleRemoveItem(i)}
              className="px-2 text-red-500 hover:bg-red-50 rounded"
              type="button"
            >
              ×
            </button>
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleAddItem}
            className="text-xs px-2 py-1 text-teal-600 hover:bg-teal-50 rounded"
            type="button"
          >
            + Add item
          </button>
          <button
            onClick={handleSave}
            className="text-xs px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const ListTag = ordered ? "ol" : "ul";

  return (
    <div
      onClick={() => {
        setEditItems(items.length > 0 ? items : [""]);
        setIsEditing(true);
      }}
      className="cursor-pointer px-2 py-1 -mx-2 -my-1 rounded hover:bg-slate-100 transition-colors group"
    >
      {items.length > 0 ? (
        <ListTag
          className={`${ordered ? "list-decimal" : "list-disc"} list-inside text-slate-700 space-y-1`}
        >
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ListTag>
      ) : (
        <p className="text-slate-400 italic">{placeholder}</p>
      )}

      {/* Edit hint */}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 text-xs mt-1 block">
        Click to edit list
      </span>

      {/* Edited indicator */}
      {isEdited && (
        <span className="mt-1 inline-block px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-600 rounded">
          Edited
        </span>
      )}
    </div>
  );
}

