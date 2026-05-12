<template>
  <div class="dealer-badges">
    <span v-if="isDealer" class="badge badge-dealer" title="Dealer">D</span>
    <span v-if="isSmallBlind" class="badge badge-sb" title="Small Blind">SB</span>
    <span v-if="isBigBlind" class="badge badge-bb" title="Big Blind">BB</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isDealer: boolean
  isSmallBlind: boolean
  isBigBlind: boolean
}>()
</script>

<style scoped>
.dealer-badges {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(0,0,0,0.5);
}

.badge-dealer {
  background: white;
  color: #111;
  border: 2px solid #888;
}

.badge-sb {
  background: #1565c0;
  color: white;
  font-size: 8px;
  width: 24px;
  border-radius: 10px;
}

.badge-bb {
  background: #b71c1c;
  color: white;
  font-size: 8px;
  width: 24px;
  border-radius: 10px;
}
</style>
