<template>
  <button class="sound-toggle" @click="$emit('toggle')" :title="enabled ? 'Mute sounds' : 'Enable sounds'">
    <span class="sound-icon">{{ enabled ? '🔊' : '🔇' }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  enabled: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<style scoped>
.sound-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
}

.sound-toggle:hover {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.3);
}
</style>
