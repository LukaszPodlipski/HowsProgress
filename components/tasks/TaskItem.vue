<script setup lang="ts">
import { Item, ItemContent, ItemTitle, ItemActions } from '@/components/ui/item'
import type { Task } from '@/types'

defineProps<{
  task: Task
}>()
</script>

<template>
  <Item variant="outline" class="transition-colors hover:border-accent">
    <ItemContent>
      <ItemTitle>{{ task.text }}</ItemTitle>
      <!-- <ItemDescription> A simple item with title and description. </ItemDescription> -->
    </ItemContent>
    <ItemActions>
      <!-- <Button variant="outline" size="sm"> Action </Button> -->
    </ItemActions>
  </Item>
</template>
