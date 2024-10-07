const withInit = (WrappedComponent: React.ComponentType) => {
  const ComponentWithInit = (props: any) => {
    return <WrappedComponent {...props} />;
  };
  // Need to do this because getting Component defintion is missing display name error

  ComponentWithInit.displayName = `withInit(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithInit;
};

export default withInit;
