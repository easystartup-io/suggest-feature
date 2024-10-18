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

export default function CrispButton({ }) {
  return (
    <Button variant="default" className='bg-indigo-500 hover:bg-indigo-500/80'
      onClick={() => openCrisp({ message: { msg: "Hi there! I have some queries." } })}
    >
      <MessageCircleMore className="w-6 h-6" />
      Get in touch
    </Button>
  )
}
