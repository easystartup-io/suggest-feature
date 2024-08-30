import { Crisp } from "crisp-sdk-web"

export function openCrisp({ user, params, message = undefined }) {
  Crisp.user.setEmail(user.email);
  Crisp.user.setNickname(user.name);
  Crisp.session.setData({ orgSlug: params.slug });
  Crisp.chat.open()
  if (message && message.msg) {
    Crisp.message.sendText(message.msg)
  }
}
