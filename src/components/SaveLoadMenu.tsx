import React from 'react';
import { saveService } from '../services/saveService';

interface SaveLoadMenuProps {
  onClose: () => void;
  isLoading?: boolean;
  onLoad?: () => void;
  saveEnabled?: boolean;
}

export const SaveLoadMenu: React.FC<SaveLoadMenuProps> = ({ 
  onClose, 
  isLoading,
  onLoad,
  saveEnabled = true 
}) => {
  const [saveSlots, setSaveSlots] = React.useState<Array<{id: number, date: Date}>>([]);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    setSaveSlots(saveService.getSaveSlots());
  }, []);

  const handleSave = async (slotId: number) => {
    try {
      await saveService.saveGame(slotId);
      setSaveSlots(saveService.getSaveSlots());
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleLoad = async (slotId: number) => {
    try {
      console.log('Starting load process for slot:', slotId);
      await saveService.loadGame(slotId);
      setError('');
      console.log('Save loaded successfully, calling onLoad callback');
      if (onLoad) {
        onLoad();
      }
      onClose();
    } catch (err) {
      console.error('Error during load:', err);
      setError((err as Error).message);
    }
  };

  const handleDelete = (slotId: number) => {
    saveService.deleteSave(slotId);
    setSaveSlots(saveService.getSaveSlots());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-navy-blue p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">存档/读档</h2>
        
        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(slotId => {
            const saveData = saveSlots.find(s => s.id === slotId);
            
            return (
              <div key={slotId} className="flex items-center space-x-2">
                <span className="w-20">存档 {slotId}</span>
                {saveData ? (
                  <span className="flex-1 text-sm">
                    {saveData.date.toLocaleString()}
                  </span>
                ) : (
                  <span className="flex-1 text-sm text-gray-500">空</span>
                )}
                {saveEnabled && (
                  <button
                    onClick={() => handleSave(slotId)}
                    disabled={isLoading}
                    className="px-2 py-1 bg-sky-blue hover:bg-opacity-80 rounded"
                  >
                    保存
                  </button>
                )}
                <button
                  onClick={() => handleLoad(slotId)}
                  disabled={isLoading || !saveData}
                  className="px-2 py-1 bg-sky-blue hover:bg-opacity-80 rounded"
                >
                  读取
                </button>
                {saveData && (
                  <button
                    onClick={() => handleDelete(slotId)}
                    disabled={isLoading}
                    className="px-2 py-1 bg-royal-purple hover:bg-opacity-80 rounded"
                  >
                    删除
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full p-2 bg-sky-blue hover:bg-opacity-80 rounded"
        >
          关闭
        </button>
      </div>
    </div>
  );
}; 