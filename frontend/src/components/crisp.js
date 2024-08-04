"use client"

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("94c9e5d4-0c9b-42d9-954f-3b67e494038c", {
      autoload: false
    });
  });

  return null;
}

export default CrispChat;
