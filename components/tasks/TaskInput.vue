<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowUpIcon, PlusIcon } from 'lucide-vue-next'

const { addTask } = useTasks()

const messageSchema = z.object({
  message: z.string().max(1000, 'Wiadomość nie może przekraczać 1000 znaków'),
})

type MessageForm = z.infer<typeof messageSchema>

const { handleSubmit, defineField, errors } = useForm<MessageForm>({
  validationSchema: toTypedSchema(messageSchema),
  initialValues: {
    message: '',
  },
})

const [message, messageAttrs] = defineField('message')

const onSubmit = handleSubmit(formValues => {
  addTask(formValues.message)
  message.value = ''
})
</script>

<template>
  <form @submit.prevent="onSubmit">
    <InputGroup>
      <InputGroupTextarea
        v-model="message"
        v-bind="messageAttrs"
        placeholder="Ask, Search or Chat..."
        :class="{ 'aria-invalid': errors.message }"
      />
      <InputGroupAddon align="block-end">
        <InputGroupButton variant="outline" class="rounded-full" size="icon-xs">
          <PlusIcon class="size-4" />
        </InputGroupButton>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <InputGroupButton variant="ghost"> Auto </InputGroupButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" class="[--radius:0.95rem]">
            <DropdownMenuItem>Auto</DropdownMenuItem>
            <DropdownMenuItem>Agent</DropdownMenuItem>
            <DropdownMenuItem>Manual</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <InputGroupText class="ml-auto"> {{ message.length }} / 1000 </InputGroupText>
        <Separator orientation="vertical" class="!h-4" />
        <InputGroupButton
          type="submit"
          variant="default"
          class="rounded-full"
          size="icon-xs"
          :disabled="!message || message.length === 0"
        >
          <ArrowUpIcon class="size-4" />
          <span class="sr-only">Send</span>
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
    <!-- Wyświetlanie błędów walidacji -->
    <p v-if="errors.message" class="mt-2 text-sm text-destructive">{{ errors.message }}</p>
  </form>
</template>
