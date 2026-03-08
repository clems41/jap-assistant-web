import {definePreset} from '@primeng/themes';
import Aura from '@primeng/themes/aura';

export const MyPreset = definePreset(Aura, {
    semantic: {
      primary: {
        50: 'var(--color-cam-5)',
        100: 'var(--color-cam-15)',
        200: 'var(--color-cam-50)',
        300: 'var(--color-cam-80)',
        400: 'var(--color-cam-100)',
        500: 'var(--color-cam-120)',
      },
      colorScheme: {
        light: {
          formField: {
            paddingX: '10px',
            paddingY: '10px',
            placeholderColor: 'var(--color-gris-50)',
            background: 'var(--color-blanc-100)',
            color: 'var(--color-gris-100)',
            borderColor: 'var(--color-gris-30)',

            hoverBackground: 'var(--color-blanc-100)',
            hoverBorderColor: 'var(--color-cam-50)',

            focusBorderColor: 'var(--color-gris-30)',

            disabledColor: 'var(--color-gris-50)',
            disabledBackground: 'var(--color-gris-5)',

            invalidColor: 'var(--color-rouge-100)',
            invalidBorderColor: 'var(--color-rouge-100)',
            invalidPlaceholderColor: 'var(--color-rouge-100)'
          },
          dropdown: {
            selectedBackground: 'var(--color-cam-100)',
            selectedColor: 'var(--color-blanc-100)',

            hoverBackground: 'var(--color-blanc-100)',
            hoverColor: 'var(--color-cam-50)',

            clearIconColor: 'var(--color-gris-100)',
            triggerIconColor: 'var(--color-gris-100)'
          },
          primary: {
            color: 'var(--color-cam-100)',
            contrastColor: 'var(--color-blanc-100)',
            hoverColor: 'var(--color-cam-80)',
            activeColor: 'var(--color-cam-120)'
          },
        }
      },
      surface: {
        50: 'var(--color-gris-5)',
        100: 'var(--color-gris-15)',
        200: 'var(--color-gris-50)',
        300: 'var(--color-gris-80)',
        400: 'var(--color-gris-100)',
        500: 'var(--color-gris-120)',
      },
    },
    components: {
      dialog: {
        colorScheme: {
          light: {
            root: {
              headerPadding: '0px',
              color: 'var(--color-cam-100)',
              background: 'var(--color-blanc-100)',
            }
          }
        }
      },
      fileupload: {
        colorScheme: {
          light: {
            root: {
              color: 'var(--color-cam-100)',
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
              handleContentBackground: 'var(--color-cam-100)',
              handleBackground: 'var(--color-cam-100)',
              handleContentHoverBackground: 'var(--color-cam-120)',
              handleHoverBackground: 'var(--color-cam-120)',
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
              iconColor: 'var(--color-cam-100)',
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
              color: 'var(--color-cam-100)',
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
              background: 'var(--color-cam-50)',
              valueBackground: 'var(--color-jaune-100)',
            }
          }
        }
      },
      paginator: {
        colorScheme: {
          light: {
            root: {
              borderRadius: '30px',
              background: 'var(--color-cam-5)',
              navButtonSelectedBackground: 'var(--color-cam-80)',
              navButtonSelectedColor: 'var(--color-blanc-100)',
              navButtonHoverBackground: 'var(--color-cam-120)',
              navButtonHoverColor: 'var(--color-blanc-100)',
              navButtonBackground: 'var(--color-cam-5)',
              navButtonColor: 'var(--color-cam-100)',
            }
          }
        }
      },
      chip: {
        colorScheme: {
          light: {
            root: {
              borderRadius: '9999px',
              background: 'var(--color-cam-secondary-100)',
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
              checkedBackground: 'var(--color-vert-100)',
              background: 'var(--color-gris-80)',
              checkedHoverBackground: 'var(--color-vert-120)',
              hoverBackground: 'var(--color-gris-100)',
            }
          }
        }
      },
      card: {
        colorScheme: {
          light: {
            root: {
              background: 'var(--color-cam-5)',
              borderColor: 'var(--color-gris-15)',
              color: 'var(--color-cam-100)',
              subtitleColor: 'var(--color-cam-80)',
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
              color: 'var(--color-cam-100)',
              subtitleColor: 'var(--color-cam-80)',
            }
          }
        }
      },
      tabs: {
        colorScheme: {
          light: {
            root: {
              tablistBackground: 'transparent',
              tablistBorderColor: 'transparent',
              tabBorderColor: 'transparent',
              tabHoverBorderColor: 'var(--color-blanc-80)',
              tabBorderWidth: '0px 0px 4px 0px',
              tabActiveBorderColor: 'var(--color-jaune-100)',
              tabColor: 'var(--color-blanc-80)',
              tabActiveColor: 'var(--color-blanc-100)',
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
      toast: {
        success: {
          background: 'var(--color-vert-5) !important',
          borderColor: 'var(--color-vert-80) !important',
          color: 'var(--color-vert-120) !important',
          detailColor: 'var(--color-vert-120) !important'
        },
        info: {
          background: 'var(--color-bleu-5) !important',
          borderColor: 'var(--color-bleu-80) !important',
          color: 'var(--color-bleu-120) !important',
          detailColor: 'var(--color-bleu-120) !important'
        },
        warning: {
          background: 'var(--color-jaune-5) !important',
          borderColor: 'var(--color-jaune-80) !important',
          color: 'var(--color-jaune-120) !important',
          detailColor: 'var(--color-jaune-120) !important'
        },
        error: {
          background: 'var(--color-rouge-5) !important',
          borderColor: 'var(--color-rouge-80) !important',
          color: 'var(--color-rouge-120) !important',
          detailColor: 'var(--color-rouge-120) !important'
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
              background: 'var(--color-cam-100)',
              hoverBackground: 'var(--color-cam-80)',
              activeBackground: 'var(--color-cam-120)',
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
              background: 'var(--color-rouge-100)',
              hoverBackground: 'var(--color-rouge-80)',
              activeBackground: 'var(--color-rouge-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--color-blanc-100)',
              hoverColor: 'var(--color-blanc-100)',
              activeColor: 'var(--color-blanc-100)',
            },
            warn: {
              background: 'var(--color-orange-100)',
              hoverBackground: 'var(--color-orange-80)',
              activeBackground: 'var(--color-orange-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--color-blanc-100)',
              hoverColor: 'var(--color-blanc-100)',
              activeColor: 'var(--color-blanc-100)',
            },
            success: {
              background: 'var(--color-vert-100)',
              hoverBackground: 'var(--color-vert-80)',
              activeBackground: 'var(--color-vert-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--color-blanc-100)',
              hoverColor: 'var(--color-blanc-100)',
              activeColor: 'var(--color-blanc-100)',
            },
            info: {
              background: 'var(--color-bleu-100)',
              hoverBackground: 'var(--color-bleu-80)',
              activeBackground: 'var(--color-bleu-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--color-blanc-100)',
              hoverColor: 'var(--color-blanc-100)',
              activeColor: 'var(--color-blanc-100)',
            },
            contrast: {
              background: 'var(--color-jaune-100)',
              hoverBackground: 'var(--color-jaune-80)',
              activeBackground: 'var(--color-jaune-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--color-cam-100)',
              hoverColor: 'var(--color-cam-100)',
              activeColor: 'var(--color-cam-100)',
            },
            outlined: {
              primary: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-cam-120)',
                color: 'var(--color-cam-120)',
              },
              secondary: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-cam-secondary-120)',
                color: 'var(--color-cam-secondary-120)',
              },
              danger: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-rouge-120)',
                color: 'var(--color-rouge-120)',
              },
              warn: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-orange-120)',
                color: 'var(--color-orange-120)',
              },
              success: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-vert-120)',
                color: 'var(--color-vert-120)',
              },
              info: {
                hoverBackground: 'var(--color-blanc-100)',
                activeBackground: 'var(--color-blanc-100)',
                borderColor: 'var(--color-bleu-120)',
                color: 'var(--color-bleu-120)',
              },
              contrast: {
                hoverBackground: 'var(--color-cam-80)',
                activeBackground: 'var(--color-cam-100)',
                borderColor: 'var(--color-jaune-100)',
                color: 'var(--color-jaune-100)',
              },
            }
          }
        }
      }
    }
  })
;
