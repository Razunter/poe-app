<script>
  import { Button, FormGroup, Input } from 'sveltestrap'
  import Icon from '@iconify/svelte'
  import cogIcon from '@iconify/icons-mdi/cog'
  import accessPointNetwork from '@iconify/icons-mdi/access-point-network'
  import sortAscending from '@iconify/icons-mdi/sort-ascending'
  import rotate3dVariant from '@iconify/icons-mdi/rotate-3d-variant'
  import vacuumIcon from '@iconify/icons-mdi/vacuum'
  import contentSave from '@iconify/icons-mdi/content-save'
</script>

<template>
    <aside class='sidebar'>
        <div class='card'>
            <div class='card-header'>
                <h4 class='card-title mb-0'>Actions</h4>
            </div>
            <div class='card-body'>
                <Button color='light' size='lg' class='w-100'>
                    <span class='button-inner'><Icon icon={cogIcon} class='icon-inline' /><span class='button-text'>Settings</span></span>
                </Button>
                <hr />
                <div class='d-grid gap-2'>
                    <Button color='primary' size='lg'>
                        <span class='button-inner'><Icon icon={accessPointNetwork} class='icon-inline' /><span
                                class='button-text'>Sync builds</span></span>
                    </Button>
                    <Button color='primary' size='lg'>
                        <span class='button-inner'><Icon icon={sortAscending} class='icon-inline' /><span
                                class='button-text'>Sort builds</span></span>
                    </Button>
                    <Button color='primary' size='lg'>
                        <span class='button-inner'><Icon icon={rotate3dVariant} class='icon-inline' /><span
                                class='button-text'>Randomize order</span></span>
                    </Button>
                    <Button color='primary' size='lg'>
                        <span class='button-inner'><Icon icon={vacuumIcon} class='icon-inline' /><span
                                class='button-text'>Cleanup outdated</span></span>
                    </Button>
                    <hr />
                    <Button color='success' size='lg'>
                        <span class='button-inner'><Icon icon={contentSave} class='icon-inline' /><span
                                class='button-text'>Save</span></span>
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

  .button-inner {
    display: flex;
    justify-content: flex-start;
    align-items: center;

    .button-text {
      display: block;
    }
  }

  :global .icon-inline {
    margin-right: .4em;
    display: block;
    width: 1.2em;
    height: 1.2em;
  }

  .form-check {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 0;

    .form-check-input  {
      cursor: pointer;
      float: none;
      margin-left: 0;
    }
  }
</style>
