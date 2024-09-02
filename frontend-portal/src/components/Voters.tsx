import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from '@/components/ui/separator';

const getInitials = (name) => {
  const words = name.split(' ');
  let initials;
  if (words.length > 1) {
    initials = words.map(word => word[0]).join('').toUpperCase();
  } else {
    initials = name.slice(0, 2).toUpperCase();
  }
  return initials.length >= 2 ? initials.slice(0, 2) : initials.padEnd(2, initials[0]);
};

const Voters = ({ voters }) => {
  const displayedVoters = voters.slice(0, 3);
  const remainingVoters = voters.length - 3;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Voters</h2>
        <span className="text-gray-600 dark:text-gray-400 font-semibold">{voters.length}</span>
      </div>
      <Separator className='my-4' />
      {voters.length > 0 ? (
        <div className="flex -space-x-2 overflow-hidden">
          {displayedVoters.map((voter, index) => (
            <Avatar key={index} className="inline-block border-2 border-white dark:border-gray-800">
              <AvatarImage src={voter.user.profilePic} alt={voter.user.name} />
              <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {getInitials(voter.user.name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {remainingVoters > 0 && (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800">
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">+{remainingVoters}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 italic">No voters yet</p>
      )}
    </div>
  );
};

export default Voters;
