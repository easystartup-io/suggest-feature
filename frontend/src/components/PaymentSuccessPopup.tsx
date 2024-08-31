"use client"
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';

const PaymentSuccessPopup = ({ isOpen, onClose }) => {
  const [showBalloons, setShowBalloons] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const screenWidth = window.innerWidth;
      confetti({
        particleCount: screenWidth < 480 ? 50 : 100,
        spread: screenWidth < 480 ? 45 : 70,
        origin: { y: 0.6 }
      });

      // Show balloons after a short delay
      setTimeout(() => setShowBalloons(true), 300);
    } else {
      setShowBalloons(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-11/12 max-w-lg">
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center relative overflow-hidden h-64 sm:h-80">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Payment Successful!</h2>
          <p className="mb-4 sm:mb-6 text-sm sm:text-base">Thank you for your purchase.</p>
          {showBalloons && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-float-up text-2xl sm:text-4xl"
                  style={{
                    left: `${Math.random() * 100}%`,
                    bottom: `-${Math.random() * 20 + 10}%`,
                    animationDuration: `${Math.random() * 3 + 2}s`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                >
                  🎈
                </div>
              ))}
            </div>
          )}
          <Button onClick={onClose} className="mt-2 sm:mt-4">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSuccessPopup;
