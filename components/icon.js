/*
 * @Author: czy0729
 * @Date: 2019-03-15 08:20:56
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-03-21 23:03:54
 */
import React from 'react'
import { Icon } from 'expo'

const _Icon = ({ style, name, size = 20, color, ...other }) => (
  <Icon.Ionicons
    style={[
      {
        height: size
      },
      style
    ]}
    name={name}
    size={size}
    color={color}
    {...other}
  />
)

export default _Icon
