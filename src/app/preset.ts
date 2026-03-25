import {definePreset} from '@primeng/themes';
import Aura from '@primeng/themes/aura';

export const MyPreset = definePreset(Aura, {
    semantic: {
      primary: {
        50:  'var(--color-primary-5)',
        100: 'var(--color-primary-15)',
        200: 'var(--color-primary-30)',
        300: 'var(--color-primary-50)',
        400: 'var(--color-primary-80)',
        500: 'var(--color-primary-100)',
        600: 'var(--color-primary-120)',
      },
      colorScheme: {
        light: {
          formField: {
            paddingX: '10px',
            paddingY: '10px',
            placeholderColor: 'var(--color-contrast-50)',
            background: 'var(--color-blanc-100)',
            color: 'var(--color-contrast-100)',
            borderColor: 'var(--color-gris-30)',

            hoverBackground: 'var(--color-blanc-100)',
            hoverBorderColor: 'var(--color-primary-50)',

            focusBorderColor: 'var(--color-gris-30)',

            disabledColor: 'var(--color-gris-50)',
            disabledBackground: 'var(--color-gris-5)',

            invalidColor: 'var(--color-error-100)',
            invalidBorderColor: 'var(--color-error-100)',
            invalidPlaceholderColor: 'var(--color-error-100)'
          },
          dropdown: {
            selectedBackground: 'var(--color-primary-100)',
            selectedColor: 'var(--color-blanc-100)',

            hoverBackground: 'var(--color-blanc-100)',
            hoverColor: 'var(--color-primary-50)',

            clearIconColor: 'var(--color-gris-100)',
            triggerIconColor: 'var(--color-gris-100)'
          },
          primary: {
            color: 'var(--color-primary-100)',
            contrastColor: 'var(--color-blanc-100)',
            hoverColor: 'var(--color-primary-80)',
            activeColor: 'var(--color-primary-120)'
          },
          secondary: {
            color: 'var(--color-secondary-100)',
            contrastColor: 'var(--color-blanc-100)',
            hoverColor: 'var(--color-secondary-80)',
            activeColor: 'var(--color-secondary-120)'
          },
          info: {
            color: 'var(--color-info-100)',
            contrastColor: 'var(--color-blanc-100)',
            hoverColor: 'var(--color-info-80)',
            activeColor: 'var(--color-info-120)'
          },
          success: {
            color: 'var(--color-success-100)',
            contrastColor: 'var(--color-blanc-100)',
            hoverColor: 'var(--color-success-80)',
            activeColor: 'var(--color-success-120)'
          },
          warn: {
            color: 'var(--color-warn-100)',
            contrastColor: 'var(--color-blanc-100)',
            hoverColor: 'var(--color-warn-80)',
            activeColor: 'var(--color-warn-120)'
          },
          error: {
            color: 'var(--color-error-100)',
            contrastColor: 'var(--color-blanc-100)',
            hoverColor: 'var(--color-error-80)',
            activeColor: 'var(--color-error-120)'
          },
          contrast: {
            color: 'var(--color-contrast-100)',
            contrastColor: 'var(--color-blanc-100)',
            hoverColor: 'var(--color-contrast-80)',
            activeColor: 'var(--color-contrast-120)'
          },
        }
      },
      surface: {
        50:  'var(--color-gris-5)',
        100: 'var(--color-gris-15)',
        200: 'var(--color-gris-30)',
        300: 'var(--color-gris-50)',
        400: 'var(--color-gris-80)',
        500: 'var(--color-gris-100)',
        600: 'var(--color-gris-120)',
      },
    },
    components: {
      dialog: {
        colorScheme: {
          light: {
            root: {
              color: 'var(--color-primary-100)',
              background: 'var(--color-blanc-100)',
            }
          }
        }
      },
      fileupload: {
        colorScheme: {
          light: {
            root: {
              color: 'var(--color-primary-100)',
              background: 'var(--color-blanc-100)',
            }
          }
        }
      },
      autocomplete: {
        colorScheme: {
          light: {
            root: {
              borderRadius: '9999px',
              chipBorderRadius: '9999px',
              dropdownBackground: 'var(--color-blanc-100)',
            }
          }
        }
      },
      slider: {
        colorScheme: {
          light: {
            root: {
              handleContentBackground: 'var(--color-primary-100)',
              handleBackground: 'var(--color-primary-100)',
              handleContentHoverBackground: 'var(--color-primary-120)',
              handleHoverBackground: 'var(--color-primary-120)',
              trackSize: '8px',
              handleHeight: '16px',
              handleWidth: '16px',
              borderRadius: '9999px',
            }
          }
        }
      },
      confirmdialog: {
        colorScheme: {
          light: {
            root: {
              iconColor: 'var(--color-primary-100)',
            }
          }
        }
      },
      popover: {
        colorScheme: {
          light: {
            root: {
              contentPadding: '0px',
              borderRadius: '2.5rem',
              color: 'var(--color-primary-100)',
              background: 'var(--color-blanc-100)',
              borderColor: 'transparent',
            }
          }
        }
      },
      inputotp: {
        colorScheme: {
          light: {
            root: {
              inputWidth: '4rem',
            }
          }
        }
      },
      progressbar: {
        colorScheme: {
          light: {
            root: {
              height: '1rem',
              borderRadius: '6rem',
              background: 'var(--color-primary-50)',
              valueBackground: 'var(--color-contrast-100)',
            }
          }
        }
      },
      paginator: {
        colorScheme: {
          light: {
            root: {
              borderRadius: '30px',
              background: 'var(--color-primary-5)',
              navButtonSelectedBackground: 'var(--color-primary-80)',
              navButtonSelectedColor: 'var(--color-blanc-100)',
              navButtonHoverBackground: 'var(--color-primary-120)',
              navButtonHoverColor: 'var(--color-blanc-100)',
              navButtonBackground: 'var(--color-primary-5)',
              navButtonColor: 'var(--color-primary-100)',
            }
          }
        }
      },
      chip: {
        colorScheme: {
          light: {
            root: {
              borderRadius: '9999px',
              background: 'var(--color-secondary-100)',
              color: 'var(--color-blanc-100)',
              iconColor: 'var(--color-blanc-100) !important',
              removeIconColor: 'var(--color-blanc-100) !important',
            }
          }
        }
      },
      toggleswitch: {
        colorScheme: {
          light: {
            root: {
              checkedBackground: 'var(--color-success-100)',
              background: 'var(--color-gris-80)',
              checkedHoverBackground: 'var(--color-success-120)',
              hoverBackground: 'var(--color-gris-100)',
            }
          }
        }
      },
      card: {
        colorScheme: {
          light: {
            root: {
              background: 'var(--color-primary-5)',
              borderColor: 'var(--color-gris-15)',
              color: 'var(--color-primary-100)',
              subtitleColor: 'var(--color-primary-80)',
            }
          }
        }
      },
      multiselect: {
        colorScheme: {
          light: {
            root: {
              chipBorderRadius: '9999px',
              borderColor: 'var(--color-gris-15)',
              color: 'var(--color-primary-100)',
              subtitleColor: 'var(--color-primary-80)',
            }
          }
        }
      },
      tabs: {
        colorScheme: {
          light: {
            root: {
              tablistBackground: 'transparent',
              tabpanelBackground: 'transparent',
              tablistBorderColor: 'var(--color-gris-15)',
              tabBorderColor: 'transparent',
              tabHoverBorderColor: 'var(--color-primary-50)',
              tabBorderWidth: '0px 0px 3px 0px',
              tabActiveBorderColor: 'var(--color-primary-100)',
              tabColor: 'var(--color-gris-80)',
              tabActiveColor: 'var(--color-contrast-100)',
            }
          }
        }
      },
      floatlabel: {
        colorScheme: {
          light: {
            root: {
              fontWeight: 400,
              color: 'var(--color-gris-50)',
              focusColor: 'var(--color-gris-50)',
              activeColor: 'var(--color-gris-50)',
              invalidColor: 'var(--color-gris-50)'
            }
          }
        }
      },
      organizationchart: {
        colorScheme: {
          light: {
            root: {
              gutter: '0.5rem',
              node: {
                padding: '0px',
                borderColor: 'var(--color-gris-80)',
                background: 'var(--color-blanc-100)',
              },
              connector: {
                color: 'var(--color-gris-80)',
              }
            }
          }
        }
      },
      toast: {
        success: {
          background: 'var(--color-success-5) !important',
          borderColor: 'var(--color-success-80) !important',
          color: 'var(--color-success-120) !important',
          detailColor: 'var(--color-success-120) !important'
        },
        info: {
          background: 'var(--color-info-5) !important',
          borderColor: 'var(--color-info-80) !important',
          color: 'var(--color-info-120) !important',
          detailColor: 'var(--color-info-120) !important'
        },
        warning: {
          background: 'var(--color-warn-5) !important',
          borderColor: 'var(--color-warn-80) !important',
          color: 'var(--color-warn-120) !important',
          detailColor: 'var(--color-warn-120) !important'
        },
        error: {
          background: 'var(--color-error-5) !important',
          borderColor: 'var(--color-error-80) !important',
          color: 'var(--color-error-120) !important',
          detailColor: 'var(--color-error-120) !important'
        }
      },
      button: {
        colorScheme: {
          light: {
            paddingX: '20px',
            paddingY: '10px',
            text: {
              secondary: {
                hoverBackground: 'var(--color-gris-15)',
                color: 'var(--color-gris-80)',
              }
            },
            borderRadius: '9999px',
            primary: {
              background: 'var(--color-primary-100)',
              hoverBackground: 'var(--color-primary-80)',
              activeBackground: 'var(--color-primary-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--color-blanc-100)',
              hoverColor: 'var(--color-blanc-100)',
              activeColor: 'var(--color-blanc-100)',
            },
            secondary: {
              background: 'transparent',
              hoverBackground: 'transparent',
              activeBackground: 'transparent',
              borderColor: 'var(--color-blanc-100)',
              hoverBorderColor: 'var(--color-blanc-100)',
              activeBorderColor: 'var(--color-blanc-100)',
              color: 'var(--color-blanc-100)',
              hoverColor: 'var(--color-blanc-100)',
              activeColor: 'var(--color-blanc-100)',
            },
            danger: {
              background: 'var(--color-error-100)',
              hoverBackground: 'var(--color-error-80)',
              activeBackground: 'var(--color-error-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--color-blanc-100)',
              hoverColor: 'var(--color-blanc-100)',
              activeColor: 'var(--color-blanc-100)',
            },
            warn: {
              background: 'var(--color-warn-100)',
              hoverBackground: 'var(--color-warn-80)',
              activeBackground: 'var(--color-warn-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--color-blanc-100)',
              hoverColor: 'var(--color-blanc-100)',
              activeColor: 'var(--color-blanc-100)',
            },
            success: {
              background: 'var(--color-success-100)',
              hoverBackground: 'var(--color-success-80)',
              activeBackground: 'var(--color-success-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--color-blanc-100)',
              hoverColor: 'var(--color-blanc-100)',
              activeColor: 'var(--color-blanc-100)',
            },
            info: {
              background: 'var(--color-info-100)',
              hoverBackground: 'var(--color-info-80)',
              activeBackground: 'var(--color-info-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--color-blanc-100)',
              hoverColor: 'var(--color-blanc-100)',
              activeColor: 'var(--color-blanc-100)',
            },
            contrast: {
              background: 'var(--color-contrast-100)',
              hoverBackground: 'var(--color-contrast-80)',
              activeBackground: 'var(--color-contrast-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--color-blanc-100)',
              hoverColor: 'var(--color-blanc-100)',
              activeColor: 'var(--color-blanc-100)',
            },
            outlined: {
              primary: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-primary-120)',
                color: 'var(--color-primary-120)',
              },
              secondary: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-secondary-120)',
                color: 'var(--color-secondary-120)',
              },
              danger: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-error-120)',
                color: 'var(--color-error-120)',
              },
              warn: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-warn-120)',
                color: 'var(--color-warn-120)',
              },
              success: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-success-120)',
                color: 'var(--color-success-120)',
              },
              info: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-info-120)',
                color: 'var(--color-info-120)',
              },
              contrast: {
                hoverBackground: 'var(--color-blanc-80)',
                activeBackground: 'var(--color-blanc-80)',
                borderColor: 'var(--color-contrast-100)',
                color: 'var(--color-contrast-100)',
              },
            }
          }
        }
      }
    }
  })
;
