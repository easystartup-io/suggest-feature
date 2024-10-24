"use client"
import { Button } from "@/components/ui/button";
import { Crisp } from "crisp-sdk-web";
import { MessageCircleMore } from 'lucide-react';

function openCrisp({ message = undefined }) {
  Crisp.chat.open()
  if (message && message.msg) {
    Crisp.message.sendText(message.msg)
  }
}

export default function CrispButton({ msg = "Hi there! I have some queries." }) {
  return (
    <Button variant="default" className='bg-indigo-700 hover:bg-indigo-700/80'
      onClick={() => openCrisp({ message: { msg } })}
    >
      <MessageCircleMore className="w-6 h-6 mr-2" />
      Get in touch
    </Button>
  )
}
