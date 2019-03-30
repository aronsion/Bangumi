/*
 * @Author: czy0729
 * @Date: 2019-03-24 05:24:48
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-03-29 07:10:34
 */
import React from 'react'
import { View } from 'react-native'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { Text } from '@components'
import _ from '@styles'

const Summary = ({ style }, { $ }) => {
  const { name, summary } = $.subject
  return (
    <View style={[_.container.wind, style]}>
      <Text size={20}>简介</Text>
      <Text style={_.mt.sm} type='desc' size={15} lineHeight={24}>
        {name ? summary || '(空)' : summary}
      </Text>
    </View>
  )
}

Summary.contextTypes = {
  $: PropTypes.object
}

export default observer(Summary)
