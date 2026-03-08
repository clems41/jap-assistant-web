import {definePreset} from '@primeng/themes';
import Aura from '@primeng/themes/aura';

export const MyPreset = definePreset(Aura, {
    semantic: {
      primary: {
        50: 'var(--cam-5)',
        100: 'var(--cam-15)',
        200: 'var(--cam-50)',
        300: 'var(--cam-80)',
        400: 'var(--cam-100)',
        500: 'var(--cam-120)',
      },
      colorScheme: {
        light: {
          formField: {
            paddingX: '10px',
            paddingY: '10px',
            placeholderColor: 'var(--gris-50)',
            background: 'var(--blanc-100)',
            color: 'var(--gris-100)',
            borderColor: 'var(--gris-30)',

            hoverBackground: 'var(--blanc-100)',
            hoverBorderColor: 'var(--cam-50)',

            focusBorderColor: 'var(--gris-30)',

            disabledColor: 'var(--gris-50)',
            disabledBackground: 'var(--gris-5)',

            invalidColor: 'var(--rouge-100)',
            invalidBorderColor: 'var(--rouge-100)',
            invalidPlaceholderColor: 'var(--rouge-100)'
          },
          dropdown: {
            selectedBackground: 'var(--cam-100)',
            selectedColor: 'var(--blanc-100)',

            hoverBackground: 'var(--blanc-100)',
            hoverColor: 'var(--cam-50)',

            clearIconColor: 'var(--gris-100)',
            triggerIconColor: 'var(--gris-100)'
          },
          primary: {
            color: 'var(--cam-100)',
            contrastColor: 'var(--blanc-100)',
            hoverColor: 'var(--cam-80)',
            activeColor: 'var(--cam-120)'
          },
        }
      },
      surface: {
        50: 'var(--gris-5)',
        100: 'var(--gris-15)',
        200: 'var(--gris-50)',
        300: 'var(--gris-80)',
        400: 'var(--gris-100)',
        500: 'var(--gris-120)',
      },
    },
    components: {
      dialog: {
        colorScheme: {
          light: {
            root: {
              headerPadding: '0px',
              color: 'var(--cam-100)',
              background: 'var(--blanc-100)',
            }
          }
        }
      },
      fileupload: {
        colorScheme: {
          light: {
            root: {
              color: 'var(--cam-100)',
              background: 'var(--blanc-100)',
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
              dropdownBackground: 'var(--blanc-100)',
            }
          }
        }
      },
      slider: {
        colorScheme: {
          light: {
            root: {
              handleContentBackground: 'var(--cam-100)',
              handleBackground: 'var(--cam-100)',
              handleContentHoverBackground: 'var(--cam-120)',
              handleHoverBackground: 'var(--cam-120)',
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
              iconColor: 'var(--cam-100)',
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
              color: 'var(--cam-100)',
              background: 'var(--blanc-100)',
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
              background: 'var(--cam-50)',
              valueBackground: 'var(--jaune-100)',
            }
          }
        }
      },
      paginator: {
        colorScheme: {
          light: {
            root: {
              borderRadius: '30px',
              background: 'var(--cam-5)',
              navButtonSelectedBackground: 'var(--cam-80)',
              navButtonSelectedColor: 'var(--blanc-100)',
              navButtonHoverBackground: 'var(--cam-120)',
              navButtonHoverColor: 'var(--blanc-100)',
              navButtonBackground: 'var(--cam-5)',
              navButtonColor: 'var(--cam-100)',
            }
          }
        }
      },
      chip: {
        colorScheme: {
          light: {
            root: {
              borderRadius: '9999px',
              background: 'var(--cam-secondary-100)',
              color: 'var(--blanc-100)',
              iconColor: 'var(--blanc-100) !important',
              removeIconColor: 'var(--blanc-100) !important',
            }
          }
        }
      },
      toggleswitch: {
        colorScheme: {
          light: {
            root: {
              checkedBackground: 'var(--vert-100)',
              background: 'var(--gris-80)',
              checkedHoverBackground: 'var(--vert-120)',
              hoverBackground: 'var(--gris-100)',
            }
          }
        }
      },
      card: {
        colorScheme: {
          light: {
            root: {
              background: 'var(--cam-5)',
              borderColor: 'var(--gris-15)',
              color: 'var(--cam-100)',
              subtitleColor: 'var(--cam-80)',
            }
          }
        }
      },
      multiselect: {
        colorScheme: {
          light: {
            root: {
              chipBorderRadius: '9999px',
              borderColor: 'var(--gris-15)',
              color: 'var(--cam-100)',
              subtitleColor: 'var(--cam-80)',
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
              tabHoverBorderColor: 'var(--blanc-80)',
              tabBorderWidth: '0px 0px 4px 0px',
              tabActiveBorderColor: 'var(--jaune-100)',
              tabColor: 'var(--blanc-80)',
              tabActiveColor: 'var(--blanc-100)',
            }
          }
        }
      },
      floatlabel: {
        colorScheme: {
          light: {
            root: {
              fontWeight: 400,
              color: 'var(--gris-50)',
              focusColor: 'var(--gris-50)',
              activeColor: 'var(--gris-50)',
              invalidColor: 'var(--gris-50)'
            }
          }
        }
      },
      toast: {
        success: {
          background: 'var(--vert-5) !important',
          borderColor: 'var(--vert-80) !important',
          color: 'var(--vert-120) !important',
          detailColor: 'var(--vert-120) !important'
        },
        info: {
          background: 'var(--bleu-5) !important',
          borderColor: 'var(--bleu-80) !important',
          color: 'var(--bleu-120) !important',
          detailColor: 'var(--bleu-120) !important'
        },
        warning: {
          background: 'var(--jaune-5) !important',
          borderColor: 'var(--jaune-80) !important',
          color: 'var(--jaune-120) !important',
          detailColor: 'var(--jaune-120) !important'
        },
        error: {
          background: 'var(--rouge-5) !important',
          borderColor: 'var(--rouge-80) !important',
          color: 'var(--rouge-120) !important',
          detailColor: 'var(--rouge-120) !important'
        }
      },
      button: {
        colorScheme: {
          light: {
            paddingX: '20px',
            paddingY: '10px',
            text: {
              secondary: {
                hoverBackground: 'var(--gris-15)',
                color: 'var(--gris-80)',
              }
            },
            borderRadius: '9999px',
            primary: {
              background: 'var(--cam-100)',
              hoverBackground: 'var(--cam-80)',
              activeBackground: 'var(--cam-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--blanc-100)',
              hoverColor: 'var(--blanc-100)',
              activeColor: 'var(--blanc-100)',
            },
            secondary: {
              background: 'transparent',
              hoverBackground: 'transparent',
              activeBackground: 'transparent',
              borderColor: 'var(--blanc-100)',
              hoverBorderColor: 'var(--blanc-100)',
              activeBorderColor: 'var(--blanc-100)',
              color: 'var(--blanc-100)',
              hoverColor: 'var(--blanc-100)',
              activeColor: 'var(--blanc-100)',
            },
            danger: {
              background: 'var(--rouge-100)',
              hoverBackground: 'var(--rouge-80)',
              activeBackground: 'var(--rouge-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--blanc-100)',
              hoverColor: 'var(--blanc-100)',
              activeColor: 'var(--blanc-100)',
            },
            warn: {
              background: 'var(--orange-100)',
              hoverBackground: 'var(--orange-80)',
              activeBackground: 'var(--orange-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--blanc-100)',
              hoverColor: 'var(--blanc-100)',
              activeColor: 'var(--blanc-100)',
            },
            success: {
              background: 'var(--vert-100)',
              hoverBackground: 'var(--vert-80)',
              activeBackground: 'var(--vert-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--blanc-100)',
              hoverColor: 'var(--blanc-100)',
              activeColor: 'var(--blanc-100)',
            },
            info: {
              background: 'var(--bleu-100)',
              hoverBackground: 'var(--bleu-80)',
              activeBackground: 'var(--bleu-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--blanc-100)',
              hoverColor: 'var(--blanc-100)',
              activeColor: 'var(--blanc-100)',
            },
            contrast: {
              background: 'var(--jaune-100)',
              hoverBackground: 'var(--jaune-80)',
              activeBackground: 'var(--jaune-120)',
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
              color: 'var(--cam-100)',
              hoverColor: 'var(--cam-100)',
              activeColor: 'var(--cam-100)',
            },
            outlined: {
              primary: {
                hoverBackground: 'var(--blanc-100)',
                activeBackground: 'var(--blanc-100)',
                borderColor: 'var(--cam-120)',
                color: 'var(--cam-120)',
              },
              secondary: {
                hoverBackground: 'var(--blanc-100)',
                activeBackground: 'var(--blanc-100)',
                borderColor: 'var(--cam-secondary-120)',
                color: 'var(--cam-secondary-120)',
              },
              danger: {
                hoverBackground: 'var(--blanc-100)',
                activeBackground: 'var(--blanc-100)',
                borderColor: 'var(--rouge-120)',
                color: 'var(--rouge-120)',
              },
              warn: {
                hoverBackground: 'var(--blanc-100)',
                activeBackground: 'var(--blanc-100)',
                borderColor: 'var(--orange-120)',
                color: 'var(--orange-120)',
              },
              success: {
                hoverBackground: 'var(--blanc-100)',
                activeBackground: 'var(--blanc-100)',
                borderColor: 'var(--vert-120)',
                color: 'var(--vert-120)',
              },
              info: {
                hoverBackground: 'var(--blanc-100)',
                activeBackground: 'var(--blanc-100)',
                borderColor: 'var(--bleu-120)',
                color: 'var(--bleu-120)',
              },
              contrast: {
                hoverBackground: 'var(--cam-80)',
                activeBackground: 'var(--cam-100)',
                borderColor: 'var(--jaune-100)',
                color: 'var(--jaune-100)',
              },
            }
          }
        }
      }
    }
  })
;
