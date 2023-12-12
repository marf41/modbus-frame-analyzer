# modbus-frame-analyzer
Simple tool to analyze Modbus TCP frames. You can input up to three frames.

On input (hex, case insensitive, whitespaces are removed):
```
33 FD 00 00 00 06 01 03 00 00 00 42
```

Outputs:
```
Transaction ID: 13309
Protocol ID: 0 - OK
Length:     6 == 6
Unit ID: 1
Function code: 3 - Read Multiple Holding Registers
Payload: 0, 0, 0, 66
REQUEST: Read 66 registers from address 0.
```

Can recognize IPv4 packets, copied from Wireshark as "Hex Stream":
```
This doesn't parse as Modbus frame!
Trying to parse as whole IPv4 packet (click here to remove first 54 bytes):
Transaction ID: ...
```

If it doesn't find the expected `00 00` at bytes `2` and `3` (Modbus protocol ID), it tries to search rest of the input:
```
Seeking possible frame starts: 
   13 - Transaction ID:    69. Length: 24424 <> 90. Unit ID: 38. Function code: 64 - UNKNOWN FUNCTION. Payload: 0, 128, 6, 17, 21, 192, 168, 0, 5, 192, ... FUNCTION UNSUPPORTED BY ANALYZER
   50 - Transaction ID: 52888. Length: 13325 <> 53. Unit ID: 0. Function code: 0 - NULL. 
   54 - Transaction ID: ...
```

### TODO

- [ ] Add rest of function analyzers (only codes 3 and 16 supported now)
