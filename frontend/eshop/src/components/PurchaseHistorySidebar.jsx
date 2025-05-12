import { memo, useCallback, useState } from 'react';
import { X, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const PurchaseHistorySidebar = memo(
  ({
    purchaseHistoryOpen,
    setPurchaseHistoryOpen,
    purchaseHistory,
    setPurchaseHistory,
    products,
    setProducts,
  }) => {
    const [isHidden, setIsHidden] = useState(true);

    const handleUndoPurchase = useCallback(
      (purchaseId) => {
        const purchase = purchaseHistory.find((p) => p.purchaseId === purchaseId);
        if (!purchase) return;

        setProducts((prev) =>
          prev.map((p) =>
            p.id === purchase.id
              ? { ...p, quantity: p.quantity + purchase.quantity }
              : p
          )
        );
        setPurchaseHistory((prev) =>
          prev.filter((p) => p.purchaseId !== purchaseId)
        );
        toast.success('Purchase undone successfully');
      },
      [purchaseHistory, setPurchaseHistory, setProducts]
    );

    const handleClearHistory = useCallback(() => {
      setPurchaseHistory([]);
      toast.success('Purchase history cleared');
    }, [setPurchaseHistory]);

    return (
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          purchaseHistoryOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
            <h2 className="text-lg font-semibold">Purchase History</h2>
            <button
              onClick={() => setPurchaseHistoryOpen(false)}
              className="p-1 hover:bg-blue-700 rounded-full"
              aria-label="Close purchase history"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {purchaseHistory.length === 0 ? (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-500 text-center">
                No purchase history yet.
              </p>
            </div>
          ) : (
            <div className="flex-grow p-4 overflow-y-auto scrollbar-thin">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setIsHidden(!isHidden)}
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  aria-label={isHidden ? 'Show purchase details' : 'Hide purchase details'}
                >
                  {isHidden ? (
                    <Eye className="h-4 w-4 mr-1" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-1" />
                  )}
                  {isHidden ? 'Show Details' : 'Hide Details'}
                </button>
                <button
                  onClick={handleClearHistory}
                  className="text-red-600 hover:text-red-800 flex items-center text-sm"
                  aria-label="Clear purchase history"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear History
                </button>
              </div>
              <div className="space-y-4">
                {purchaseHistory
                  .slice()
                  .reverse()
                  .map((purchase) => (
                    <div
                      key={purchase.purchaseId}
                      className="border border-gray-200 rounded-lg p-3 animate-fade-in"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            {purchase.name}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {new Date(purchase.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleUndoPurchase(purchase.purchaseId)}
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                          aria-label={`Undo purchase of ${purchase.name}`}
                        >
                          Undo
                        </button>
                      </div>
                      {!isHidden && (
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Price:</span>{' '}
                            ${purchase.unitPrice.toFixed(2)}
                          </p>
                          <p>
                            <span className="font-medium">Quantity:</span>{' '}
                            {purchase.quantity}
                          </p>
                          <p>
                            <span className="font-medium">Total:</span>{' '}
                            ${(purchase.unitPrice * purchase.quantity).toFixed(2)}
                          </p>
                          <p>
                            <span className="font-medium">Category:</span>{' '}
                            {purchase.category}
                          </p>
                          <p>
                            <span className="font-medium">Status:</span>{' '}
                            {purchase.status}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default PurchaseHistorySidebar;