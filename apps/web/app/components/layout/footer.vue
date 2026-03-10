<template>
  <UFooter>
    <template #left>
      <p class="text-muted text-sm flex items-center gap-2">
        <NuxtImg
          src="/icon.svg"
          :width="20"
          :height="20"
        />
        <span>Copyright © {{ new Date().getFullYear() }}</span>
      </p>
    </template>
    <template #right>
      <UButton
        icon="i-simple-icons-x"
        color="neutral"
        variant="ghost"
        to="https://go.nuxt.com/x"
        target="_blank"
        aria-label="X"
      />
    </template>
  </UFooter>
</template>
