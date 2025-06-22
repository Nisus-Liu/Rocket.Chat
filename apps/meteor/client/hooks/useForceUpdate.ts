import { useState } from 'react';

export const useForceUpdate = () => {
	const [value, setValue] = useState(0); // 整数计数器
	return () => setValue((value) => value + 1); // 更新状态来触发重新渲染
};
