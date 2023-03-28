<script>
  import {Button, FormGroup, Input} from 'sveltestrap'
  import Icon from '@iconify/svelte'
  import cogIcon from '@iconify/icons-mdi/cog'
  import accessPointNetwork from '@iconify/icons-mdi/access-point-network'
  import sortAscending from '@iconify/icons-mdi/sort-ascending'
  import rotate3dVariant from '@iconify/icons-mdi/rotate-3d-variant'
  import vacuumIcon from '@iconify/icons-mdi/vacuum'
  import contentSave from '@iconify/icons-mdi/content-save'
  import {BuildsData} from '$lib/BuildsData'
</script>

<template>
  <aside class='sidebar'>
    <div class='card'>
      <div class='card-header'>
        <h4 class='card-title mb-0'>Actions</h4>
      </div>
      <div class='card-body'>
        <Button color='light' size='lg' class='btn-icon w-100'>
          <span class='btn-icon__inner'><Icon icon={cogIcon} class='btn-icon__icon'/><span class='btn-icon__text'>Settings</span></span>
        </Button>
        <hr/>
        <div class='d-grid gap-2'>
          <Button color='primary' size='lg' class="btn-icon">
                        <span class='btn-icon__inner'><Icon icon={accessPointNetwork} class='btn-icon__icon'/><span
                          class='btn-icon__text'>Sync builds</span></span>
          </Button>
          <Button color='primary' size='lg' class="btn-icon">
                        <span class='btn-icon__inner'><Icon icon={sortAscending} class='btn-icon__icon'/><span
                          class='btn-icon__text'>Sort builds</span></span>
          </Button>
          <Button color='primary' size='lg' class="btn-icon">
                        <span class='btn-icon__inner'><Icon icon={rotate3dVariant} class='btn-icon__icon'/><span
                          class='btn-icon__text'>Randomize order</span></span>
          </Button>
          <Button color='primary' size='lg' class="btn-icon">
                        <span class='btn-icon__inner'><Icon icon={vacuumIcon} class='btn-icon__icon'/><span
                          class='btn-icon__text'>Cleanup outdated</span></span>
          </Button>
          <hr/>
          <Button
            color='success'
            size='lg'
            on:click={() => {
            $BuildsData.save()
          }}>
                        <span class='btn-icon__inner'><Icon icon={contentSave} class='btn-icon__icon'/><span
                          class='btn-icon__text'>Save</span></span>
          </Button>
        </div>
      </div>
      <div class='card-footer'>
        <h4 class='card-title'>Filters:</h4>
        <div class='form-check form-switch'>
          <label class='form-check-label' for='filterOutdated'>Show outdated</label>
          <input placeholder='' class='form-check-input' id='filterOutdated' type='checkbox' name='' value=''>
        </div>
      </div>
    </div>
  </aside>
</template>

<style lang='scss'>
  .sidebar {
    padding-left: var(--bs-grid-gutter-width-half);
    padding-right: var(--bs-grid-gutter-width-half);
  }

  .form-check {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 0;

    .form-check-input {
      cursor: pointer;
      float: none;
      margin-left: 0;
    }
  }
</style>
